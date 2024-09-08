import { Browser, Frame, Page } from "puppeteer";
import path from "path";

import { clickConfirm } from "../utils/confirmPopup";
import { convertToNumber } from "../utils/convertToNumber";
import { delay, randomDelay } from "../utils/delay";
import { logger } from "../logger/logger";
import { selectFrame } from "../utils/puppeteerHelper";
import { AccountResults } from "../types";
import { blumBotSelectors, commonSelectors } from "../utils/selectors";
import { reloadBotFunc } from "../utils/reloadBotFunc";

const { continueButtonPrimary, claimButton, continueButton, playButton, balanceLabel, ticketLabel, closeBotButton } =
  blumBotSelectors;
const playBlumGame = async (browser: Browser, appUrl: string) => {
  logger.debug("🎮 Blum");

  const page = await browser.newPage();

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

    await page.waitForSelector(commonSelectors.launchBotButton, { timeout: 30000 });
    await delay(5000);
    await page.click(commonSelectors.launchBotButton);

    await clickConfirm(page, "blum");

    const iframe = await selectFrame(page, "blum");

    const wrongUploadingBot = await page.$$("div > button.reset");
    if (wrongUploadingBot.length > 0) {
      await retryReloadBot(page, 3);
    }

    try {
      await handleClaimButtons(iframe, 15000);
      const [currentBalance, currentTickets] = await Promise.all([extractBalance(iframe), extractTickets(iframe)]);
      result.BalanceBefore = currentBalance;

      logger.info(`💰 Starting balance: ${currentBalance}`, "blum");
      logger.info(`🎟  Playing ${currentTickets} tickets`, "blum");

      const scriptPath = path.resolve(__dirname, "../injectables/blum-game.js");

      const tickets = convertToNumber(currentTickets);
      if (tickets > 0) {
        await iframe.addScriptTag({ path: scriptPath });

        await delay(tickets * 35000);

        await iframe.$eval(continueButtonPrimary, (el) => {
          (el as HTMLElement).click();
        });

        const [currentBalance, currentTickets] = await Promise.all([extractBalance(iframe), extractTickets(iframe)]);

        logger.info(`💰 Ending balance: ${currentBalance}`, "blum");
        logger.info(`🎟  Remaining tickets: ${currentTickets}`, "blum");

        result.BalanceAfter = currentBalance;
        result.Tickets = currentTickets;
      } else {
        result.BalanceAfter = currentBalance;
        result.Tickets = currentTickets;
      }
    } catch (error) {
      logger.error(`An error occurred during game-play: ${error}`, "blum");
    } finally {
      await page.close();
    }
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error}`, "blum");
  }

  return result;
};

const retryReloadBot = async (page: Page, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const wrongUploadingBot = await page.$$("div > button.reset");

    if (wrongUploadingBot.length > 0) {
      logger.info(`Attempt ${attempt} to reload the bot...`);
      await reloadBotFunc(page, closeBotButton, "blum");

      await randomDelay(1, 2, "s");
    }

    const recheck = await page.$$("#__blum > div > button.reset");
    if (recheck.length === 0) {
      logger.info("Bot reloaded successfully.");
      return;
    }

    if (attempt === retries) {
      logger.error("Max retries reached. Closing browser...");
      await page.browser().close();
      return;
    }
  }
};

const handleClaimButtons = async (iframe: Frame, delayTimeout: number = 5000): Promise<void> => {
  if (!iframe) {
    logger.error("Iframe not found.", "blum");
    return;
  }

  await delay(delayTimeout);

  let isAlreadyFraming: boolean = false;

  const clickButton = async (selector: string, type: "continue" | "claim" | "start farming", message: string) => {
    let buttonText = "[None]";
    try {
      buttonText = await iframe.$eval(selector, (el) => {
        const text = (el as HTMLElement).textContent?.trim().toLowerCase() || "[None]";
        (el as HTMLElement).click();
        return text;
      });

      if (buttonText.includes(type)) {
        logger.info(message, "blum");
      } else if (buttonText.includes("farming")) {
        isAlreadyFraming = true;
        logger.info("Already farming.", "blum");
      }
    } catch (error) {
      if (type !== "continue") {
        logger.warning(`No actionable "${type}" button found.`, "blum");
      }
    } finally {
      await delay(5000);
    }
  };

  await clickButton(continueButton, "continue", "Daily rewards step");
  await clickButton(claimButton, "claim", "Start farming button appeared after claiming. Clicking it...");
  if (!isAlreadyFraming) {
    await clickButton(claimButton, "start farming", "Farming button appeared after claiming. Clicking it...");
  }
};

const extractValue = async (iframe: Frame, selector: string, errorMessage: string): Promise<string> => {
  if (!iframe) {
    logger.error("Iframe not found.", "blum");
    return "[None]";
  }

  try {
    const extractedValue = await iframe.$eval(selector, (el) => el.textContent?.trim());
    return extractedValue || "[None]";
  } catch (error) {
    logger.error(errorMessage, "blum");
    throw error;
  }
};

const extractBalance = (iframe: Frame) => {
  return extractValue(iframe, balanceLabel, "Error extracting balance");
};

const extractTickets = (iframe: Frame) => {
  return extractValue(iframe, ticketLabel, "Error extracting tickets");
};

export default playBlumGame;
