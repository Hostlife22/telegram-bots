import { readFile } from "node:fs/promises";
import { scheduleJob } from "node-schedule";

import { BrowserManager } from "./BrowserManager";
import { ParsedGameResult, TgApp } from "../types";
import { ReportManager } from "./ReportManager";
import { TelegramNotifier } from "./TelegramNotifier";
import { shuffleArray } from "../utils/shuffle";
import { logger } from "./Logger";
import { getRandomNumberBetween } from "../utils/delay";

export class GameProcessor {
  private initRun = process.env.INIT_RUN === "true";
  private telegramNotifier: TelegramNotifier;
  private browserManager: BrowserManager;
  private reportManager: ReportManager;
  private processedAccounts = new Set<string>();
  private parallelLimit = 2;
  private reports: ParsedGameResult[] = [];

  constructor(telegramNotifier: TelegramNotifier, browserManager: BrowserManager, reportManager: ReportManager) {
    this.telegramNotifier = telegramNotifier;
    this.browserManager = browserManager;
    this.reportManager = reportManager;
  }

  start() {
    this.initRun ? this.executeTask() : this.scheduleNextTask();
  }

  private scheduleNextTask() {
    const taskTime = new Date(Date.now() + getRandomNumberBetween(181, 228) * 60 * 1000);
    this.notifySchedule(taskTime);
    const job = scheduleJob(taskTime, async () => {
      await this.executeTask();
      job.cancel();
      this.scheduleNextTask();
    });
  }

  async executeTask() {
    try {
      await this.telegramNotifier.startPolling();

      const tgApplications: TgApp[] = await this.loadApplications();
      const totalResultGames = await this.playGames(tgApplications);
      const filteredTgApplication = tgApplications.filter((result) => result.active);

      this.reports.push(...totalResultGames);
      await this.telegramNotifier.sendSummary(this.processedAccounts);

      if (this.processedAccounts.size === filteredTgApplication.length) {
        logger.debug(`Success processed all accounts (${filteredTgApplication.length}), scheduling process...`);
        const groupedGames = this.groupValuesByGame(this.reports);
        await this.reportManager.sendGameReports(groupedGames);
        this.clearProcessedData();
      } else {
        logger.debug(`Only ${this.processedAccounts.size} accounts processed, run others again.`);
        await this.executeTask();
      }
    } catch (e) {
      await this.telegramNotifier.notifyError(e);
    } finally {
      this.telegramNotifier.stopPolling();
    }
  }

  async playGames(tgApps: TgApp[]) {
    const totalResultGames: ParsedGameResult[] = [];
    const taskPool: Promise<void>[] = [];
    let taskPosition = 0;

    const runGameTask = async (tgApp: TgApp) => {
      taskPosition++;

      if (this.processedAccounts.has(tgApp.code) && !tgApp.active) return;

      const rawResultGames = await this.browserManager.playGamesByAccount(tgApp, `${taskPosition}/${tgApps.length}`);
      if (rawResultGames.length) {
        const resultGames = this.prepareResultGames(rawResultGames, tgApp);
        totalResultGames.push(...resultGames);
        this.processedAccounts.add(tgApp.code);
      }
    };

    for (const tgApp of shuffleArray(tgApps)) {
      if (taskPool.length >= this.parallelLimit) await Promise.race(taskPool);
      const task = runGameTask(tgApp).then(() => {
        taskPool.splice(taskPool.indexOf(task), 1);
      });

      taskPool.push(task);
    }

    await Promise.all(taskPool);
    return totalResultGames;
  }

  private async loadApplications(): Promise<TgApp[]> {
    const tgApps = await readFile(process.env.ACCOUNTS_JSON_PATH || "./data/apps.json", "utf8");
    return JSON.parse(tgApps);
  }

  private clearProcessedData() {
    this.reports = [];
    this.processedAccounts.clear();
    this.scheduleNextTask();
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

  private groupValuesByGame(inputArray: ParsedGameResult[]) {
    const grouped = inputArray.reduce(
      (acc, { game, data }) => {
        if (!acc[game]) acc[game] = [];
        acc[game].push(data);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    Object.keys(grouped).forEach((game) => {
      grouped[game] = grouped[game].map((element, index) => ({ ...element, Number: index + 1 }));
    });

    return grouped;
  }

  notifySchedule(taskTime: Date) {
    this.telegramNotifier.notifySchedule(taskTime);
  }
}