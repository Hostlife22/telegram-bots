import "dotenv/config";
import puppeteer from "puppeteer";
import { readFile } from "node:fs/promises";
import { scheduleJob } from "node-schedule";

import ReportGenerator from "./reports/report";
import TgClient from "./bot/telegram";
import playGame from "./games/main";
import { AppName, ParsedGameResult, TgApp } from "./types";
import { adsOpenBrowser } from "./ads/api";
import { formatTime } from "./utils/datetime";
import { getRandomNumberBetween, randomDelay } from "./utils/delay";
import { logger } from "./logger/logger";
import { shuffleArray } from "./utils/shuffle";

class ExecuteContainer {
  private initRun = process.env.INIT_RUN === "true";
  private processedAccounts = new Set();
  private reports = [] as ParsedGameResult[];
  private parallelLimit = 2;
  private telegram;

  constructor() {
    this.validateEnv();
    this.telegram = {
      client: new TgClient(process.env.TG_TOKEN),
      receiverId: process.env.TG_RECEIVER_ID,
    };
  }

  play() {
    this.initRun ? this.executeTask() : this.scheduleTask();
  }

  scheduleTask() {
    const taskTime = new Date(Date.now() + getRandomNumberBetween(181, 228) * 60 * 1000);
    this.telegram.client.sendAndPinMessage(`🕒 NEXT FIRE ON <b>${formatTime(taskTime)}</b> 🕒`, this.telegram.receiverId);
    const job = scheduleJob(taskTime, async () => {
      await this.executeTask();
      job.cancel();
    });
  }

  async executeTask() {
    try {
      const [_, tgApps]: [any, string] = await Promise.all([
        this.telegram.client.startPolling(),
        readFile(process.env.ACCOUNTS_JSON_PATH || "./data/apps.json", "utf8"),
      ]);
      const tgApplications: TgApp[] = JSON.parse(tgApps);
      const totalResultGames = await this.startPlayingGames(tgApplications, this.parallelLimit);
      this.reports.push(...totalResultGames);
      const summaryText = this.prepareBriefSummaryText();
      await this.telegram.client.sendMessage(summaryText, this.telegram.receiverId);

      if (this.processedAccounts.size === tgApplications.length) {
        logger.debug(`Success processed all accounts (${tgApplications.length}), scheduling process...`);
        const groupedGames = this.groupValuesByGame(this.reports);
        await this.sendReports(groupedGames);
        this.clearAndScheduleTask();
      } else {
        logger.debug(`Only ${this.processedAccounts.size} accounts processed, run others again.`);
        await this.executeTask();
      }
    } catch (e) {
      logger.error(e);
      await this.telegram.client.sendMessage(`😫 ${e}`, this.telegram.receiverId);
    } finally {
      await this.telegram.client.stopPolling();
    }
  }

  async startPlayingGames(tgApps: TgApp[], parallelLimit: number) {
    const totalResultGames: ParsedGameResult[] = [];
    const accCount = tgApps.length;
    let accPosition = 0;

    const taskPool: Promise<void>[] = [];

    const runGameTask = async (tgApp: TgApp) => {
      accPosition++;

      if (this.processedAccounts.has(tgApp.code)) {
        return;
      }

      const rawResultGames = await this.playGamesByAccount(tgApp, accCount, accPosition);
      if (rawResultGames.length) {
        const resultGames = this.prepareResultGames(rawResultGames, tgApp);
        totalResultGames.push(...resultGames);
        this.processedAccounts.add(tgApp.code);
      }
    };

    for (const tgApp of shuffleArray(tgApps)) {
      if (taskPool.length >= parallelLimit) {
        await Promise.race(taskPool);
      }

      const task = runGameTask(tgApp).then(() => {
        taskPool.splice(taskPool.indexOf(task), 1);
      });

      taskPool.push(task);
    }

    await Promise.all(taskPool);

    return totalResultGames;
  }

  async playGamesByAccount(tgApp: TgApp, accCount: number, accPosition: number) {
    if (!tgApp.active) {
      logger.debug(`❌ Аккаунт #${tgApp.id} (${accPosition}/${accCount})`);
      return [];
    }

    logger.debug(`✅ Аккаунт #${tgApp.id} (${accPosition}/${accCount})`);

    const wsEndpoint = await this.establishWsEndpoint(tgApp.code, 3);
    if (!wsEndpoint) {
      logger.error(`Failed to open browser: WebSocket endpoint is not defined after 3 attempts`);
      return [];
    }

    let browser = null;

    try {
      browser = await puppeteer.connect({
        browserWSEndpoint: wsEndpoint,
        defaultViewport: null,
      });
    } catch (e) {
      logger.error(`Cannot connect to ws: ${wsEndpoint}`);
      logger.error(e);
      return [];
    }

    const resultGames = [];
    for (const [appName, appUrl] of Object.entries(tgApp.games).filter(([_]) => {
      if (process.env.GAME) return _ === process.env.GAME;
      return true;
    })) {
      if (appUrl) {
        const resultGame = await playGame("tapswap", browser, appUrl);
        resultGames.push({ game: appName, data: resultGame });
      } else {
        logger.warning(`There is no link to the [${appName}] app`);
      }
    }
    await randomDelay(4, 8, "s");
    await browser.close();
    return resultGames;
  }

  async establishWsEndpoint(profileUserId: string, maxRetries: number) {
    let wsEndpoint;
    for (let attempt = 1; attempt <= maxRetries && !wsEndpoint; attempt++) {
      try {
        const openResult = await adsOpenBrowser(profileUserId);
        wsEndpoint = openResult?.data?.ws?.puppeteer;
        if (!wsEndpoint) {
          throw new Error("WebSocket endpoint not found");
        }
      } catch (error) {
        logger.error(`Attempt ${attempt} failed: ${error.message}`);
        await randomDelay(4, 8, "s");
      }
    }
    return wsEndpoint;
  }

  async sendReports(groupedGames: any) {
    const reportInstance = new ReportGenerator();
    for (const [game, data] of Object.entries(groupedGames)) {
      const report = reportInstance.generateReport(game as AppName, data);
      await this.telegram.client.sendCSVDocument(report, this.telegram.receiverId, game);
    }
  }

  prepareResultGames(resultGames: ParsedGameResult[], tgApp: TgApp): ParsedGameResult[] {
    return resultGames.map((item) => ({
      game: item.game,
      data: {
        ...item.data,
        Account: tgApp.code,
        User: tgApp.username,
      },
    }));
  }

  prepareBriefSummaryText() {
    return `🎮 Game Results Summary:\r\n\r\n- Processed accounts (${this.processedAccounts.size}): ${Array.from(
      this.processedAccounts,
    ).join(" | ")}\r\n\r\n- 📂 Detailed reports are being sent as CSV files.`.trim();
  }

  groupValuesByGame(inputArray: any[]) {
    const grouped = inputArray.reduce((acc, { game, data }) => {
      if (!acc[game]) acc[game] = [];
      acc[game].push(data);
      return acc;
    }, {});

    Object.keys(grouped).forEach((game) => {
      // @ts-ignore
      grouped[game] = grouped[game].map((element, index) => ({
        ...element,
        Number: index + 1,
      }));
    });

    return grouped;
  }

  clearAndScheduleTask() {
    this.reports = [];
    this.processedAccounts.clear();
    this.scheduleTask();
  }

  private validateEnv() {
    if (!process.env.TG_TOKEN || !process.env.TG_RECEIVER_ID) {
      throw new Error("Environment variables TG_TOKEN and TG_RECEIVER_ID must be set");
    }
  }
}

new ExecuteContainer().play();
