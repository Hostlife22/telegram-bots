import { Browser } from "puppeteer";
import { logger } from "../core/Logger";
import { AccountResults } from "../types";
import { clickConfirm } from "../utils/confirmPopup";
import { delay } from "../utils/delay";

const registerGame = async (browser: Browser, appUrl: string, id: number) => {
  logger.debug(`🎮 register game #${id}`);

  const result: AccountResults = {
    Account: null,
    User: null,
    BalanceBefore: -1,
    BalanceAfter: -1,
    Tickets: -1,
  };

  const page = await browser.newPage();
  const tag = `register game #${id}`;

  try {
    await page.waitForNetworkIdle();

    await Promise.all([page.goto(appUrl), page.waitForNavigation()]);
    await delay(5000);
    await clickConfirm(page, tag);
    await delay(25000);
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error.message}`, tag);
  }
  return result;
};

export default registerGame;
