import { Browser, Frame, Page } from "puppeteer";
import path from "path";

import { clickConfirm } from "../utils/confirmPopup";
import { delay, randomDelay } from "../utils/delay";
import { clickButton, selectFrame } from "../utils/puppeteerHelper";
import { commonSelectors, tapswapBotSelectors } from "../utils/selectors";
import { getCode } from "../utils/video";
import { logger } from "../core/Logger";

interface AccountResults {
  Account: null | string;
  User: null | string;
  BalanceBefore: number | string;
  BalanceAfter: number | string;
  Tickets: number | string;
}

let unknownCodesForTasks: string[] = [];

const processVideoWatching = async (iframe: Frame, page: Page, tag: string) => {
  // Navigate to the video tab
  await iframe?.$eval(tapswapBotSelectors.videoTabButton, (el) => {
    // @ts-ignore
    el.click();
  });

  await randomDelay(1000, 1500, "ms");

  const processVideosSequentially = async () => {
    let buttonIndex = 2;

    while (true) {
      const buttonCount = await iframe.evaluate((selector) => {
        const parentDiv = document.querySelector(selector);
        const buttons = parentDiv?.querySelectorAll("button._listItem_1icg4_1");
        return buttons?.length || 0;
      }, tapswapBotSelectors.videoContainer);

      if (buttonCount === 0) {
        logger.warning("No more videos to watch", tag);
        break;
      }
      if (buttonIndex >= 2 + buttonCount)
        // If we've processed all buttons, break the loop
        break;

      const selector = `${tapswapBotSelectors.videoBaseListItem}(${buttonIndex})`;

      // Check if the current selector is still valid
      const isValidSelector = await iframe.$(selector).then((el) => !!el);

      if (isValidSelector) {
        logger.info(`Claiming watching at index ${buttonIndex}...`, tag);
        await claimWatching(iframe, page, selector, `${buttonIndex}`, tag);

        buttonIndex++;
      } else {
        break;
      }

      await delay(1000);
    }
  };

  await processVideosSequentially();
};

const playTapSwap = async (browser: Browser, appUrl: string, id: number) => {
  logger.debug(`🎮 TapSwap #${id}`);

  const page = await browser.newPage();
  const tag = `tapSwap #${id}`;

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

    await clickConfirm(page, tag);

    const iframe = await selectFrame(page, tag);

    try {
      await handleClaimButtons(iframe, 15000, tag);
      const [currentBalance, videoCount] = await Promise.all([extractBalance(iframe, tag), extractTickets(iframe, tag)]);
      result.BalanceBefore = currentBalance;

      logger.info(`💰 Starting balance: ${currentBalance}`, tag);
      logger.info(`🎟 Playing ${videoCount} video count`, tag);
      await processVideoWatching(iframe, page, tag);
    } catch (error) {
      logger.error(`An error occurred during game-play: ${error}`, tag);
    } finally {
      logger.info("Game-play completed.", tag);
      logger.warning("Unknown codes for tasks: ", unknownCodesForTasks.join(", "));
      await page.close();
    }
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error}`, tag);
  }

  return result;
};

const handleClaimButtons = async (iframe: Frame, delayTimeout: number = 5000, tag: string): Promise<void> => {
  if (!iframe) {
    logger.error("Iframe not found.", tag);
    return;
  }

  await delay(delayTimeout);

  const clickButton = async (selector: string, type: "claim", message: string) => {
    let buttonText = "[None]";
    try {
      buttonText = await iframe.$eval(selector, (el) => {
        const text = (el as HTMLElement).textContent?.trim().toLowerCase() || "[None]";
        (el as HTMLElement).click();
        return text;
      });

      if (buttonText) {
        logger.info(message, buttonText);
      }
    } catch (error) {
      logger.warning(`No actionable "${type}" button found.`, tag);
    } finally {
      await delay(5000);
    }
  };

  await clickButton(tapswapBotSelectors.claimButton, "claim", "Start farming button appeared after claiming. Clicking it...");
};

const claimWatching = async (iframe: Frame, page: Page, videoSelector: string, value: string, tag: string) => {
  try {
    await clickButton(iframe, videoSelector, "click task");
    await delay(1000);

    // Check if the video is not watched
    const startButtonElement = await iframe
      .$eval(tapswapBotSelectors.startMission, (el) => el.textContent || "")
      .catch(() => logger.warning("Start Button not found", tag));

    const isVideoNotWatched = typeof startButtonElement === "string" && startButtonElement.toLowerCase() === "start mission";

    if (isVideoNotWatched) {
      logger.info("Handle not watched Video", tag);
      await clickButton(iframe, tapswapBotSelectors.startMission, "start mission button");
      await delay(1000);
      await clickButton(iframe, tapswapBotSelectors.watchButton, "watch video button");
      await page.bringToFront();
      await goBack(page, iframe, tag);
      return;
    }

    // Check if the video is watched but not claimed with code input
    const fuckingInput = await iframe.$$("input");
    if (fuckingInput.length) {
      logger.info("Handle video with input submitting", tag);
      const nameOfTask = await iframe.$eval(tapswapBotSelectors.nameOfTask, (el) => {
        return el.textContent;
      });
      await getCode(nameOfTask).then(async (code) => {
        if (code) {
          await fuckingInput[0]?.type(code);
          await delay(1500);
          await clickButton(iframe, tapswapBotSelectors.submitButton, "submit button");
          await page.bringToFront();
          await clickButton(iframe, tapswapBotSelectors.finishMission, "finish mission button");
          await page.bringToFront();
          await clickButton(iframe, tapswapBotSelectors.claimButton, "claim button");
          await page.bringToFront();
          await goBack(page, iframe, tag);
        } else {
          logger.error("Code not found for task", nameOfTask);
          unknownCodesForTasks.push(nameOfTask);
          await goBack(page, iframe, tag);
        }
      });
    } else {
      await clickButton(iframe, tapswapBotSelectors.checkButton, "check button");
      await clickButton(iframe, tapswapBotSelectors.finishMission, "finish mission button");
      await clickButton(iframe, tapswapBotSelectors.claimButton, "claim button");
      logger.info("Handle watched Video without submit input", tag);
      await goBack(page, iframe, tag);
    }
  } catch (error) {
    logger.error("Error claiming watching:", tag);
    logger.error(error);
  }
};

const goBack = async (page: Page, iframe: Frame, tag: string) => {
  await delay(1000);

  const fuckingBackButton = await page.$$(tapswapBotSelectors.backButton);
  await fuckingBackButton[0]
    .click()
    .then(() => {
      logger.info("Back button click", tag);
    })
    .catch(() => {
      logger.error("Back button not found", tag);
    });
  await delay(1000);

  const priceTitle = await iframe
    .$eval(tapswapBotSelectors.successClaimMission2M, (el) => el.textContent?.trim())
    .catch(() => logger.error("Go Back without claim"));
  if (typeof priceTitle === "string" && priceTitle === "You've successfully completed the TapSwap cinema mission!") {
    await clickButton(iframe, tapswapBotSelectors.claimPriceButton, "Claim 2m");
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
  return extractValue(iframe, tapswapBotSelectors.totalText, "Error extracting balance", tag);
};

const extractTickets = (iframe: Frame, tag: string) => {
  return extractValue(iframe, tapswapBotSelectors.videoCount, "Error extracting tickets", tag);
};

export default playTapSwap;
