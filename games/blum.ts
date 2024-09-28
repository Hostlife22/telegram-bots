import { Browser, ElementHandle, Frame, Page, Target } from "puppeteer";
import path from "path";

import { clickConfirm } from "../utils/confirmPopup";
import { convertToNumber } from "../utils/convertToNumber";
import { delay, randomDelay } from "../utils/delay";
import { logger } from "../core/Logger";
import { hasElement, isElementAttached, safeClick, selectFrame } from "../utils/puppeteerHelper";
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

    await safeClick(page, commonSelectors.launchBotButton, tag);
    await clickConfirm(page, tag);

    const iframe = await selectFrame(page, tag);

    const wrongUploadingBot = await page.$$("div > button.reset");
    if (wrongUploadingBot.length > 0) {
      await retryReloadBot(page, 3, tag);
    }

    try {
      await handleClaimButtons(iframe, 15000, tag);
      if (process.env.CLAIM_BLUM_TASKS === "true") {
        await handleClaimTasks(iframe, browser, page, tag);
      }
      const [balanceBefore, ticketsBefore] = await Promise.all([extractBalance(iframe, tag), extractTickets(iframe, tag)]);

      result.BalanceBefore = balanceBefore;
      logger.info(`💰 Starting balance: ${balanceBefore}`, tag);
      logger.info(`🎟  Playing ${ticketsBefore} tickets`, tag);

      const scriptPath = path.resolve(__dirname, "../injectables/blum-game.js");

      const tickets = convertToNumber(ticketsBefore);
      if (tickets > 0) {
        await iframe.addScriptTag({ path: scriptPath });

        await delay(tickets * 35000);
        await delay(3000);
        await safeClick(iframe, continueButtonPrimary, tag);
      }

      const [balanceAfter, ticketsAfter] = await Promise.all([extractBalance(iframe, tag), extractTickets(iframe, tag)]);

      logger.info(`💰 Ending balance: ${balanceAfter}`, tag);
      logger.info(`🎟  Remaining tickets: ${ticketsAfter}`, tag);

      result.BalanceAfter = balanceAfter;
      result.Tickets = ticketsAfter;
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
      await delay(8000);
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
    await iframe.waitForSelector(selector, { timeout: 30000 });
    const extractedValue = await iframe.$eval(selector, (el) => el.textContent?.trim());
    return extractedValue || "[None]";
  } catch (error) {
    logger.warning(errorMessage, tag);
    return "[None]";
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
    await safeClick(iframe, blumBotSelectors.earnButton, tag);
    await delay(5000);
    await iframe.waitForSelector(blumBotSelectors.earnTitleSelector, { timeout: 30000 });

    if (
      (await hasElement(iframe, blumBotSelectors.weeklyTasks)) &&
      !(await hasElement(iframe, blumBotSelectors.weeklyTasksDone))
    ) {
      await safeClick(iframe, blumBotSelectors.weeklyTasks, tag);

      await processListTasks(iframe, browser, page, blumBotSelectors.weeklyTasksList, tag);
      await delay(5000);
      await claimTaskRewards(iframe, tag, blumBotSelectors.weeklyTasksListClaim);
      await delay(2000);

      await safeClick(iframe, blumBotSelectors.weeklyTasksListClose, tag);
    }

    const lists = await iframe.$$(blumBotSelectors.lists);

    for (const list of lists) {
      await delay(10000);
      await processListTasks(iframe, browser, page, blumBotSelectors.listTasks, tag);
      await processVerificationTasks(iframe, page, tag, blumVideoCodes);
      await claimTaskRewards(iframe, tag, blumBotSelectors.claimButtons);

      if (await isElementAttached(list)) {
        await safeClick(iframe, list, tag);
      } else {
        logger.error("List item is detached from the document.", tag);
      }
    }

    await iframe.$eval(blumBotSelectors.homeButton, (el) => (el as HTMLElement).click());
  } catch (error) {
    logger.error(`Error while processing tasks: ${error.message}`, tag);
  }
};

const processListTasks = async (iframe: Frame, browser: Browser, page: Page, selector: string, tag: string) => {
  const listTasks = await iframe.$$(selector);

  for (const taskButton of listTasks) {
    if (await isElementAttached(taskButton)) {
      const newPage = await openNewPage(browser, taskButton, iframe, tag);

      if (newPage) {
        await handleTaskPage(newPage, page, tag);
      } else {
        await handleOptionalElements(page, iframe, tag);
      }

      await delay(2000);
    } else {
      logger.error("Task button is detached from the document.", tag);
    }
  }
};

const openNewPage = async (browser: Browser, taskButton: ElementHandle, iframe: Frame, tag: string): Promise<Page | null> => {
  return new Promise<Page | null>(async (resolve) => {
    const handleTargetCreated = async (target: Target) => {
      const newPage = await target.page();
      if (newPage) {
        browser.removeAllListeners("targetcreated");
        resolve(newPage);
      }
    };

    browser.once("targetcreated", handleTargetCreated);

    await safeClick(iframe, taskButton, tag);
    await delay(4000);

    setTimeout(() => resolve(null), 15000);
  });
};

const handleTaskPage = async (newPage: Page, page: Page, tag: string) => {
  try {
    const pageUrl = newPage.url();

    if (pageUrl.includes("telegram.org")) {
      logger.info("Telegram link opened. Executing additional actions...", tag);
      // TODO: Add actions for handling Telegram, if needed
    }
  } catch (error) {
    logger.error(`Error handling task page: ${error.message}`, tag);
  } finally {
    await newPage.close();
  }
};

const processVerificationTasks = async (iframe: Frame, page: Page, tag: string, textArray: string[]) => {
  const verifyTasks = await iframe.$$(blumBotSelectors.verifyTasks);

  for (const verifyTask of verifyTasks) {
    if (await isElementAttached(verifyTask)) {
      await safeClick(iframe, verifyTask, tag);
      await delay(2000);

      let textIndex = 0;
      const inputElement = await iframe.$(blumBotSelectors.inputSelector);

      if (!inputElement) {
        logger.error(`Input not found by selector: ${blumBotSelectors.inputSelector}`, tag);
        continue;
      }

      while (textIndex < textArray.length) {
        await clearAndTypeText(iframe, blumBotSelectors.inputSelector, textArray[textIndex]);
        await safeClick(iframe, blumBotSelectors.buttonSelector, tag);
        await delay(2000);

        if (!(await hasElement(iframe, blumBotSelectors.buttonSelector))) {
          break;
        }

        textIndex++;
      }

      if (textIndex === textArray.length) {
        logger.warning("All codes entered, but the button did not disappear.", tag);
        await goBack(page);
      }
    }
  }
};

const clearAndTypeText = async (iframe: Frame, inputSelector: string, text: string) => {
  await iframe.$eval(inputSelector, (input) => {
    (input as HTMLInputElement).value = "";
  });
  await iframe.type(inputSelector, text);
};

const claimTaskRewards = async (iframe: Frame, tag: string, selector: string) => {
  const claimButtons = await iframe.$$(selector);
  for (const claimButton of claimButtons) {
    if (await isElementAttached(claimButton)) {
      await safeClick(iframe, claimButton, tag);
      await delay(3000);
    } else {
      logger.error("Claim button is detached from the document.", tag);
    }
  }
};

const handleOptionalElements = async (page: Page, iframe: Frame, tag: string) => {
  if (await hasElement(page, blumBotSelectors.boostSelector)) {
    await safeClick(page, blumBotSelectors.boostSelector, tag);
  } else if (await hasElement(iframe, blumBotSelectors.closeWalletSelector)) {
    await safeClick(iframe, blumBotSelectors.closeWalletSelector, tag);
  }
};

const goBack = async (page: Page) => {
  await safeClick(page, blumBotSelectors.backButton);
};

export default playBlumGame;
