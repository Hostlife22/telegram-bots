import { Frame, Page } from "puppeteer";

import { logger } from "../logger/logger";
import { delay, randomDelay } from "./delay";
import { commonSelectors } from "./selectors";

export const reloadBotFunc = async (page: Page | Frame, selector: string, logTag?: string): Promise<boolean> => {
  try {
    const closedButton = await page.$$(selector);
    if (closedButton.length) {
      await closedButton[0].click();
      logger.warning(`Closed bot`);
      await randomDelay(1500, 2500);
      await page.waitForSelector(commonSelectors.launchBotButton, { timeout: 30000 });
      await delay(3000);
      await page.click(commonSelectors.launchBotButton);
      logger.warning(`Relaunched bot`);
      return true;
    }
  } catch (error) {
    logger.error(`Timeout waiting for button with selector: ${selector}`, logTag ?? "helper");
  }
  return false;
};
