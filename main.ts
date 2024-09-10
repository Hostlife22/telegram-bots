import "dotenv/config";

import { AdsBrowserAPI } from "./core/AdsBrowserAPI";
import { BrowserManager } from "./core/BrowserManager";
import { GameProcessor } from "./core/GameProcessor";
import { ReportManager } from "./core/ReportManager";
import { TelegramNotifier } from "./core/TelegramNotifier";
import { logger } from "./core/Logger";

function initializeAndStartApp() {
  try {
    if (!process.env.TG_TOKEN || !process.env.TG_RECEIVER_ID) {
      throw new Error("Environment variables TG_TOKEN and TG_RECEIVER_ID must be set");
    }

    const adsAPI = new AdsBrowserAPI();
    const tgNotifier = new TelegramNotifier();
    const browserManager = new BrowserManager(adsAPI);
    const reportManager = new ReportManager(tgNotifier);
    const gameProcessor = new GameProcessor(tgNotifier, browserManager, reportManager);

    gameProcessor.start();
  } catch (error) {
    logger.error(`Failed to initialize the application: ${error.message}`);
    process.exit(1);
  }
}

initializeAndStartApp();
