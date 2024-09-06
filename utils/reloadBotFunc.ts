import { Frame, Page } from "puppeteer";

import { logger } from "../logger/logger";
import { delay, randomDelay } from "./delay";
import { commonSelectors } from "./selectors";

export const reloadBotFunc = async (page: Page | Frame, selector: string, logTag?: string): Promise<boolean> => {
  try {
    const element = await page.$$(selector);
    console.log(element, "4");
    if (element.length) {
      await element[0].click();
      logger.info(`Button clicked with selector: ${selector}`);
      await randomDelay(1500, 2500);
      await page.waitForSelector(commonSelectors.launchBotButton, { timeout: 30000 });
      await delay(5000);
      await page.click(commonSelectors.launchBotButton);
      return true;
    }
  } catch (error) {
    logger.error(`Timeout waiting for button with selector: ${selector}`, logTag ?? "helper");
  }
  return false;
};
