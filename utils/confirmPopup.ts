import { Page } from "puppeteer";

import { delay } from "./delay";
import { logger } from "../core/Logger";

export const clickConfirm = async (page: Page, tag?: string): Promise<void> => {
  try {
    delay(2000);
    const fuckingConfirmButton = await page.$$("div.popup-buttons > button:nth-child(1)");
    await fuckingConfirmButton[0].click();
    delay(2000);
  } catch (error) {
    logger.info("Popup without Confirm", tag);
  }
};
