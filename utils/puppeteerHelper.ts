import { Frame, Page } from "puppeteer";

import { logger } from "../core/Logger";
import { randomDelay, delay } from "./delay";

export const hasElement = async (page: Page | Frame, selector: string): Promise<boolean> => {
  const elements = await page.$$(selector);
  return elements.length > 0;
};

export const selectFrame = async (page: Page, tag?: string): Promise<Frame> => {
  try {
    const iframeElement = await page.waitForSelector("div.web-app-body > iframe", { timeout: 30000 });
    await delay(30000);
    const iframe = await iframeElement?.contentFrame();
    if (iframe) {
      logger.info("Frame selected", tag);
      return iframe;
    } else {
      logger.error("No iframe found", tag);
    }
  } catch (error) {
    logger.error("An error occurred while trying to open frame bot", tag);
  }
};

export const clickButton = async (page: Page | Frame, selector: string, logTag?: string): Promise<boolean> => {
  page.title;
  try {
    const element = await page.waitForSelector(selector, {
      visible: true,
      timeout: 60000,
    });
    if (element) {
      await element.click();
      logger.info(`Button clicked with selector: ${selector}`);
      await randomDelay(1500, 2500);
      return true;
    }
  } catch (error) {
    logger.error(`Timeout waiting for button with selector: ${selector}`, logTag ?? "helper");
  }
  return false;
};

export const clickDiv = async (page: Frame, selector: string, timeout: number = 20000): Promise<boolean> => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
    await page.click(selector);
    logger.info(`Div clicked with selector: ${selector}`);
    await randomDelay(1000, 2000);
    return true;
  } catch (error) {
    logger.error(`Timeout waiting for div with selector: ${selector}`);
    return false;
  }
};

export const waitForButton = async (page: Page | Frame, selector: string, timeout: number = 5000): Promise<boolean> => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
    return true;
  } catch (e) {
    return false;
  }
};

export const clickLinkWithHref = async (page: Page | Frame, href: string): Promise<void> => {
  const xpath = `//a[@href="${href}"]`;
  const buttonFound = await waitForButton(page, xpath);
  if (buttonFound) {
    await clickButton(page, xpath);
  } else {
    logger.warning(`Link with href ${href} not found.`);
  }
};
