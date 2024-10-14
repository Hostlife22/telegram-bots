import { ElementHandle, Frame, Page } from "puppeteer";

import { logger } from "../core/Logger";
import { randomDelay, delay } from "./delay";
import { commonSelectors } from "./selectors";

export const hasElement = async (page: Page | Frame, selector: string): Promise<boolean> => {
  try {
    const elements = await page.$$(selector);
    return elements.length > 0;
  } catch (err) {
    return false;
  }
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

export const clickButton = async (page: Page | Frame, selector: string, logTag?: string): Promise<void> => {
  try {
    await page.$eval(selector, (el) => {
      (el as HTMLElement).click();
    });
    logger.info(`Button clicked with selector: ${selector}`);
    await randomDelay(1500, 2500, "ms");
  } catch (error) {
    logger.error(`Timeout waiting for button with selector: ${selector}`, logTag ?? "helper");
  }
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

export const isElementAttached = async (element: ElementHandle) => {
  return await element.evaluate((el) => !!el.isConnected);
};

export const safeClick = async (iframe: Page | Frame, selectorOrElement: string | ElementHandle<Element>, tag?: string) => {
  const element = typeof selectorOrElement === "string" ? await iframe.$(selectorOrElement) : selectorOrElement;
  if (element && (await isElementAttached(element))) {
    logger.info(`Clicking element with selector ${selectorOrElement}`, tag);
    await iframe.evaluate((el) => (el as HTMLElement).click(), element);
  } else {
    logger.error(`Element with selector ${selectorOrElement} is not available or detached`, tag);
  }
};

export const ensureLoginCheck = async (page: Page, tag: string) => {
  const isAuthPage = await hasElement(page, commonSelectors.authLoginPage);

  if (isAuthPage) {
    logger.warning("Telegram Web account is not authorized", tag);
    await page.close();
  }

  return isAuthPage;
};
