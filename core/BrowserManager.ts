import puppeteer, { Browser } from "puppeteer";

import playGame from "../games/main";
import { AdsBrowserAPI } from "./AdsBrowserAPI";
import { AppName, ParsedGameResult, TgApp } from "../types";
import { delay, randomDelay } from "../utils/delay";
import { logger } from "./Logger";

export class BrowserManager {
  private adsBrowserAPI: AdsBrowserAPI;
  private isOpeningProfiles = false;

  constructor(adsBrowserAPI: AdsBrowserAPI) {
    this.adsBrowserAPI = adsBrowserAPI;
  }

  async playGamesByAccount(tgApp: TgApp, message: string): Promise<ParsedGameResult[]> {
    if (!tgApp.active) {
      logger.debug(`❌ Account #${tgApp.id} (${message})`);
      return [];
    }

    logger.debug(`✅ Account #${tgApp.id} (${message})`);
    const browser = await this.connectBrowser(tgApp);
    if (!browser) return [];

    const resultGames = await this.playGamesInBrowser(tgApp, browser);
    await randomDelay(4, 8, "s");
    await browser.close();

    return resultGames;
  }

  private async connectBrowser(tgApp: TgApp): Promise<Browser> {
    const wsEndpoint = await this.establishWsEndpoint(tgApp.code, 3, tgApp.id);
    if (!wsEndpoint) {
      logger.error(`Failed to open browser for account #${tgApp.id}: WebSocket endpoint is not defined after 3 attempts`);
      return null;
    }

    try {
      return await puppeteer.connect({
        browserWSEndpoint: wsEndpoint,
        defaultViewport: null,
      });
    } catch (e) {
      logger.error(`Cannot connect to WebSocket: ${wsEndpoint}, ${e.message}`);
      return null;
    }
  }

  private async establishWsEndpoint(profileUserId: string, maxRetries: number, tgAppId: number) {
    let wsEndpoint;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        while (this.isOpeningProfiles) await delay(2000);

        this.isOpeningProfiles = true;
        const { data } = await this.adsBrowserAPI.openBrowser(profileUserId);
        wsEndpoint = data?.ws?.puppeteer;

        if (!wsEndpoint) throw new Error("WebSocket endpoint not found");
        return wsEndpoint;
      } catch (error) {
        logger.error(`Attempt ${attempt} failed for account ${tgAppId}: ${error.message}`);
        await randomDelay(4, 8, "s");
      } finally {
        this.isOpeningProfiles = false;
      }
    }
    return wsEndpoint;
  }

  private async playGamesInBrowser(tgApp: TgApp, browser: Browser) {
    const resultGames: ParsedGameResult[] = [];

    for (const [appName, appUrl] of Object.entries(tgApp.games)) {
      if (appUrl) {
        try {
          const resultGame = await playGame(appName as AppName, browser, appUrl, tgApp.id);
          resultGames.push({ game: appName, data: resultGame });
        } catch (e) {
          logger.error(`Error in game ${appName} for account ${tgApp.id}: ${e.message}`);
        }
      } else {
        logger.warning(`No URL for game ${appName} in account #${tgApp.id}`);
      }
    }

    return resultGames;
  }
}
