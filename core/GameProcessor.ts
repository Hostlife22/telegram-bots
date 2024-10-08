import { readFile } from "node:fs/promises";
import { scheduleJob } from "node-schedule";

import { BrowserManager } from "./BrowserManager";
import { ParsedGameResult, ShuffleArrayType, TgApp } from "../types";
import { ReportManager } from "./ReportManager";
import { TelegramNotifier } from "./TelegramNotifier";
import { shuffleArray } from "../utils/shuffle";
import { logger } from "./Logger";
import { getRandomNumberBetween } from "../utils/delay";
import { startFetchImageBoard, stopFetchImageBoard } from "../fetchImageBoard";

export class GameProcessor {
  private initRun = process.env.INIT_RUN === "true";
  private telegramNotifier: TelegramNotifier;
  private browserManager: BrowserManager;
  private reportManager: ReportManager;
  private processedAccounts = new Set<string>();
  private parallelLimit = Number(process.env.PARALLEL_LIMIT) || 2;
  private reports: ParsedGameResult[] = [];
  private isTaskScheduled = false;

  constructor(telegramNotifier: TelegramNotifier, browserManager: BrowserManager, reportManager: ReportManager) {
    this.telegramNotifier = telegramNotifier;
    this.browserManager = browserManager;
    this.reportManager = reportManager;
  }

  start() {
    this.initRun ? this.executeTask() : this.scheduleNextTask();
  }

  private scheduleNextTask() {
    if (this.isTaskScheduled) {
      logger.warning("Task is already scheduled");
      return;
    }

    // BASE_TASK_TIME=60 (1h)
    const baseTime = process.env.BASE_TASK_TIME ? parseInt(process.env.BASE_TASK_TIME, 10) : 228;

    const randomMinutes = getRandomNumberBetween(baseTime - 2, baseTime + 2);
    const taskTime = new Date(Date.now() + randomMinutes * 60 * 1000);
    this.notifySchedule(taskTime);
    this.isTaskScheduled = true;

    const job = scheduleJob(taskTime, async () => {
      try {
        await this.executeTask();
      } catch (err) {
        logger.error(`An error occurred while executing the task: ${err}`);
      } finally {
        job.cancel();
        this.isTaskScheduled = false;
        this.scheduleNextTask();
      }
    });
  }

  async executeTask() {
    try {
      await this.telegramNotifier.startPolling();

      if (process.env.GAME === "pixel") {
        startFetchImageBoard();
      }

      let startId: number | undefined;
      let finishId: number | undefined;
      const args = process.argv.slice(2);
      startId = args.length > 0 ? parseInt(args[0], 10) : parseInt(process.env.START_ID, 10);
      finishId = args.length > 1 ? parseInt(args[1], 10) : parseInt(process.env.FINISH_ID, 10);

      let tgApplications: TgApp[] = await this.loadApplications();

      if (!isNaN(startId)) {
        tgApplications = tgApplications.filter((app) => app.id >= startId);
      }
      if (!isNaN(finishId)) {
        tgApplications = tgApplications.filter((app) => app.id <= finishId);
      }

      logger.warning(
        `Start Profile Id ${startId || 1}, Finish profile Id ${finishId || tgApplications[tgApplications.length - 1].id}`,
      );

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
      if (process.env.GAME === "pixel") {
        stopFetchImageBoard();
      }
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

    for (const tgApp of shuffleArray(tgApps, process.env.ORDER ? (process.env.ORDER as ShuffleArrayType) : undefined)) {
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
        Account: `#${tgApp.id} (${tgApp.code})`,
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
