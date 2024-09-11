import { Browser, ElementHandle, Frame, Page } from "puppeteer";
import path from "path";

import { clickConfirm } from "../utils/confirmPopup";
import { convertToNumber } from "../utils/convertToNumber";
import { delay, randomDelay } from "../utils/delay";
import { logger } from "../core/Logger";
import { hasElement, selectFrame } from "../utils/puppeteerHelper";
import { AccountResults } from "../types";
import { blumBotSelectors, commonSelectors } from "../utils/selectors";
import { reloadBotFunc } from "../utils/reloadBotFunc";
import { blumVideoCodes } from "../utils/video";

const { continueButtonPrimary, claimButton, continueButton, playButton, balanceLabel, ticketLabel, closeBotButton } =
  blumBotSelectors;
const playBlumGame = async (browser: Browser, appUrl: string, id: number) => {
  logger.debug(`🎮 Blum #${id}`);

  const page = await browser.newPage();
  const tag = `blum #${id}`;

  const result: AccountResults = {
    Account: null,
    User: null,
    BalanceBefore: -1,
    BalanceAfter: -1,
    Tickets: -1,
  };

  try {
    await page.waitForNetworkIdle();

    await Promise.all([page.goto(appUrl), page.waitForNavigation()]);
    await delay(20000);

    const loginCheck = await ensureLoginCheck(page, tag);
    if (loginCheck) {
      result.BalanceBefore = "Login error";
      result.BalanceAfter = "Login error";
      result.Tickets = "Login error";
      return result;
    }

    await page.waitForSelector(commonSelectors.launchBotButton, { timeout: 30000 });
    await delay(5000);
    await page.click(commonSelectors.launchBotButton);

    await clickConfirm(page, tag);

    const iframe = await selectFrame(page, tag);

    const wrongUploadingBot = await page.$$("div > button.reset");
    if (wrongUploadingBot.length > 0) {
      await retryReloadBot(page, 3, tag);
    }

    try {
      await handleClaimTasks(iframe, browser, page, tag);
      await handleClaimButtons(iframe, 15000, tag);
      const [balanceBefore, ticketsBefore] = await Promise.all([extractBalance(iframe, tag), extractTickets(iframe, tag)]);
      result.BalanceBefore = balanceBefore;

      logger.info(`💰 Starting balance: ${balanceBefore}`, tag);
      logger.info(`🎟  Playing ${ticketsBefore} tickets`, tag);

      const scriptPath = path.resolve(__dirname, "../injectables/blum-game.js");

      const tickets = convertToNumber(ticketsBefore);
      if (tickets > 0) {
        await iframe.addScriptTag({ path: scriptPath });

        await delay(tickets * 35000);
        await delay(2000);

        await iframe.$eval(continueButtonPrimary, (el) => {
          (el as HTMLElement).click();
        });

        const [balanceAfter, ticketsAfter] = await Promise.all([extractBalance(iframe, tag), extractTickets(iframe, tag)]);

        logger.info(`💰 Ending balance: ${balanceAfter}`, tag);
        logger.info(`🎟  Remaining tickets: ${ticketsAfter}`, tag);

        result.BalanceAfter = balanceAfter;
        result.Tickets = ticketsAfter;
      } else {
        result.BalanceAfter = balanceBefore;
        result.Tickets = ticketsBefore;
      }
    } catch (error) {
      logger.error(`An error occurred during game-play: ${error.message}`, tag);
    } finally {
      await page.close();
    }
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error.message}`, tag);
  }

  return result;
};

const retryReloadBot = async (page: Page, retries = 3, tag: string) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const wrongUploadingBot = await page.$$("div > button.reset");

    if (wrongUploadingBot.length > 0) {
      logger.info(`Attempt ${attempt} to reload the bot...`);
      await reloadBotFunc(page, closeBotButton, tag);

      await randomDelay(1, 2, "s");
    }

    const recheck = await page.$$("#__blum > div > button.reset");
    if (recheck.length === 0) {
      logger.info("Bot reloaded successfully.", tag);
      return;
    }

    if (attempt === retries) {
      logger.error("Max retries reached. Closing browser...", tag);
      await page.browser().close();
      return;
    }
  }
};

const ensureLoginCheck = async (page: Page, tag: string) => {
  const isAuthPage = await hasElement(page, commonSelectors.authLoginPage);

  if (isAuthPage) {
    logger.warning("Telegram Web account is not authorized", tag);
    await page.close();
  }

  return isAuthPage;
};

const handleClaimButtons = async (iframe: Frame, delayTimeout: number = 5000, tag: string): Promise<void> => {
  if (!iframe) {
    logger.error("Iframe not found.", tag);
    return;
  }

  await delay(delayTimeout);

  let isAlreadyFraming: boolean = false;

  const clickButton = async (selector: string, type: "continue" | "claim" | "start farming", message: string, tag: string) => {
    let buttonText = "[None]";
    try {
      buttonText = await iframe.$eval(selector, (el) => {
        const text = (el as HTMLElement).textContent?.trim().toLowerCase() || "[None]";
        (el as HTMLElement).click();
        return text;
      });

      if (buttonText.includes(type)) {
        logger.info(message, tag);
      } else if (buttonText.includes("farming")) {
        isAlreadyFraming = true;
        logger.info("Already farming.", tag);
      }
    } catch (error) {
      if (type !== "continue") {
        logger.info(`No actionable "${type}" button found.`, tag);
      }
    } finally {
      await delay(5000);
    }
  };

  await clickButton(continueButton, "continue", "Daily rewards step", tag);
  await clickButton(claimButton, "claim", "Start farming button appeared after claiming. Clicking it...", tag);
  if (!isAlreadyFraming) {
    await clickButton(claimButton, "start farming", "Farming button appeared after claiming. Clicking it...", tag);
  }
};

const extractValue = async (iframe: Frame, selector: string, errorMessage: string, tag: string): Promise<string> => {
  if (!iframe) {
    logger.error("Iframe not found.", tag);
    return "[None]";
  }

  try {
    const extractedValue = await iframe.$eval(selector, (el) => el.textContent?.trim());
    return extractedValue || "[None]";
  } catch (error) {
    logger.error(errorMessage, tag);
    throw error;
  }
};

const extractBalance = (iframe: Frame, tag: string) => {
  return extractValue(iframe, balanceLabel, "Error extracting balance", tag);
};

const extractTickets = (iframe: Frame, tag: string) => {
  return extractValue(iframe, ticketLabel, "Error extracting tickets", tag);
};

const handleClaimTasks = async (iframe: Frame, browser: Browser, page: Page, tag: string): Promise<void> => {
  if (!iframe) {
    logger.error("Iframe not found.", tag);
    return;
  }

  try {
    await iframe.$eval(blumBotSelectors.earnButton, (el) => (el as HTMLElement).click());
    await iframe.waitForSelector(blumBotSelectors.earnTitleSelector, { timeout: 30000 });

    const lists = await iframe.$$(blumBotSelectors.lists);

    for (const list of lists) {
      await delay(10000);
      await processListTasks(iframe, browser, page, tag);
      await processVerificationTasks(iframe, page, tag, blumVideoCodes);
      await claimTaskRewards(iframe);

      await list.click();
    }

    await iframe.$eval(blumBotSelectors.homeButton, (el) => (el as HTMLElement).click());
  } catch (error) {
    logger.error(`Error while processing tasks: ${error.message}`, tag);
  }
};

const processListTasks = async (iframe: Frame, browser: Browser, page: Page, tag: string) => {
  const listTasks = await iframe.$$(blumBotSelectors.listTasks);

  for (const taskButton of listTasks) {
    const newPage = await openNewPage(browser, taskButton, iframe);

    if (newPage) {
      await handleTaskPage(newPage, page, tag);
    }

    await delay(1000);
  }
};

const openNewPage = async (browser: Browser, taskButton: ElementHandle, iframe: Frame): Promise<Page | null> => {
  const newPagePromise = new Promise<Page | null>((resolve) => {
    const timeoutId = setTimeout(() => resolve(null), 15000);
    browser.once("targetcreated", async (target) => {
      const newPage = await target.page();
      clearTimeout(timeoutId);
      resolve(newPage);
    });
  });

  await iframe.evaluate((el) => (el as HTMLElement).click(), taskButton);
  await delay(4000);

  return newPagePromise;
};

const handleTaskPage = async (newPage: Page, page: Page, tag: string) => {
  const pageUrl = newPage.url();

  if (pageUrl.includes("telegram.org")) {
    logger.info("Telegram link opened. Executing additional actions...", tag);
    // TODO: add actions for handling Telegram, if needed
  }

  await newPage.close();
};

const processVerificationTasks = async (iframe: Frame, page: Page, tag: string, textArray: string[]) => {
  const verifyTasks = await iframe.$$(blumBotSelectors.verifyTasks);

  for (const verifyTask of verifyTasks) {
    await iframe.evaluate((el) => (el as HTMLElement).click(), verifyTask);
    await delay(2000);

    let textIndex = 0;
    const inputElement = await iframe.$(blumBotSelectors.inputSelector);

    if (!inputElement) {
      logger.error(`Input not found by selector: ${blumBotSelectors.inputSelector}`, tag);
      continue;
    }

    while (textIndex < textArray.length) {
      await clearAndTypeText(iframe, blumBotSelectors.inputSelector, textArray[textIndex]);

      await iframe.$eval(blumBotSelectors.buttonSelector, (el) => (el as HTMLElement).click());
      await delay(2000);

      if (!(await hasElement(iframe, blumBotSelectors.buttonSelector))) {
        logger.info("Button disappeared — code accepted!", tag);
        break;
      }

      textIndex++;
    }

    if (textIndex === textArray.length) {
      logger.info("All codes entered, but the button did not disappear.", tag);
      await goBack(page);
    }
  }
};

const clearAndTypeText = async (iframe: Frame, inputSelector: string, text: string) => {
  await iframe.$eval(inputSelector, (input) => {
    (input as HTMLInputElement).value = "";
  });
  await iframe.type(inputSelector, text);
};

const claimTaskRewards = async (iframe: Frame) => {
  const claimButtons = await iframe.$$(blumBotSelectors.claimButtons);
  for (const claimButton of claimButtons) {
    await iframe.evaluate((el) => (el as HTMLElement).click(), claimButton);
    await delay(2000);
  }
};

const goBack = async (page: Page) => {
  await page.$eval(blumBotSelectors.backButton, (el) => (el as HTMLElement).click());
};

export default playBlumGame;
