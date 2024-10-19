import { Page } from "puppeteer";

import { delay } from "./delay";
import { logger } from "../core/Logger";

export const clickConfirm = async (page: Page, tag?: string, confirm = true): Promise<void> => {
  try {
    await delay(2000);
    const fuckingConfirmButton = await page.$$(`div.popup-buttons > button:nth-child(${confirm === true ? "1" : "2"})`);
    await fuckingConfirmButton[0].click();
    await delay(2000);

    logger.info(`Click Confirm Launch`, tag);
  } catch (error) {
    logger.info("Popup without Confirm", tag);
  }
};
