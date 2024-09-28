import { Browser } from "puppeteer";
import { logger } from "../core/Logger";
import { AccountResults } from "../types";
import { clickConfirm } from "../utils/confirmPopup";
import { delay } from "../utils/delay";
import { handleClaimTasks, handleOnboardingButtons } from "./pixel";
import { selectFrame } from "../utils/puppeteerHelper";

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

    await delay(3000);
    await page.bringToFront();
    await clickConfirm(page, tag);
    await delay(5000);

    // TODO: FLOW AFTER REGISTRATION
    if (appUrl.includes("pixel")) {
      await page.bringToFront();
      const iframe = await selectFrame(page, tag);
      await page.bringToFront();
      await handleOnboardingButtons(iframe, 5000, tag);
      await delay(5000);

      await page.bringToFront();
      await handleClaimTasks(iframe, page, tag, true);
    }
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error.message}`, tag);
  }
  return result;
};

export default registerGame;
