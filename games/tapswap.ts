import { Browser, Frame, Page } from "puppeteer";
import path from "path";

import { clickConfirm } from "../utils/confirmPopup";
import { convertToNumber } from "../utils/convertToNumber";
import { delay, randomDelay } from "../utils/delay";
import { logger } from "../logger/logger";
import { clickButton, selectFrame } from "../utils/puppeteerHelper";
import { commonSelectors, tapswapBotSelectors } from "../utils/selectors";
import { getCode } from "../utils/video";

interface AccountResults {
  Account: null | string;
  User: null | string;
  BalanceBefore: number | string;
  BalanceAfter: number | string;
  Tickets: number | string;
}

const processVideoWatching = async (iframe: Frame, page: Page) => {
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
        console.log("No more videos to watch");
        break;
      }
      if (buttonIndex >= 2 + buttonCount)
        // If we've processed all buttons, break the loop
        break;

      const selector = `${tapswapBotSelectors.videoBaseListItem}(${buttonIndex})`;

      // Check if the current selector is still valid
      const isValidSelector = await iframe.$(selector).then((el) => !!el);

      if (isValidSelector) {
        console.log(`Claiming watching at index ${buttonIndex}...`);
        await claimWatching(iframe, page, selector, `${buttonIndex}`);

        buttonIndex++;
      } else {
        break;
      }

      await delay(1000);
    }
  };

  await processVideosSequentially();
};

const playTapSwap = async (browser: Browser, appUrl: string) => {
  logger.debug("🎮 TapSwap");

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

    await clickConfirm(page, "tapswap");

    const iframe = await selectFrame(page, "tapswap");

    try {
      await handleClaimButtons(iframe, 15000);
      const [currentBalance, videoCount] = await Promise.all([extractBalance(iframe), extractTickets(iframe)]);
      result.BalanceBefore = currentBalance;

      logger.info(`💰 Starting balance: ${currentBalance}`, "tapswap");
      logger.info(`🎟 Playing ${videoCount} video count`, "tapswap");
      await processVideoWatching(iframe, page);
    } catch (error) {
      logger.error(`An error occurred during game-play: ${error}`, "tapswap");
    } finally {
      await page.close();
    }
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error}`, "tapswap");
  }

  return result;
};

const handleClaimButtons = async (iframe: Frame, delayTimeout: number = 5000): Promise<void> => {
  if (!iframe) {
    logger.error("Iframe not found.", "tapswap");
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
      logger.warning(`No actionable "${type}" button found.`, "tapswap");
    } finally {
      await delay(5000);
    }
  };

  await clickButton(tapswapBotSelectors.claimButton, "claim", "Start farming button appeared after claiming. Clicking it...");
};

const claimWatching = async (iframe: Frame, page: Page, videoSelector: string, value: string) => {
  try {
    await clickButton(iframe, videoSelector, "click task");
    await delay(1000);

    // Check if the video is not watched
    const startButtonElement = await iframe
      .$eval(tapswapBotSelectors.startMission, (el) => el.textContent || "")
      .catch(() => logger.warning("Start Button not found"));

    const isVideoNotWatched = typeof startButtonElement === "string" && startButtonElement.toLowerCase() === "start mission";

    if (isVideoNotWatched) {
      logger.info("Handle not watched Video");
      await clickButton(iframe, tapswapBotSelectors.startMission, "start mission button");
      await delay(1000);
      await clickButton(iframe, tapswapBotSelectors.watchButton, "watch video button");
      await page.bringToFront();
      await goBack(page, iframe);
      return;
    }

    // Check if the video is watched but not claimed with code input
    const fuckingInput = await iframe.$$("input");
    if (fuckingInput.length) {
      logger.info("Handle video with input submitting");
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
          await goBack(page, iframe);
        } else {
          logger.error("Code not found");
          await goBack(page, iframe);
        }
      });
    } else {
      logger.info("Handle watched Video without submit input");
      await goBack(page, iframe);
    }
  } catch (error) {
    console.error("Error claiming watching:", error);
  }
};

const goBack = async (page: Page, iframe: Frame) => {
  await delay(1000);

  const fuckingBackButton = await page.$$(tapswapBotSelectors.backButton);
  await fuckingBackButton[0]
    .click()
    .then(() => {
      logger.info("Back button click");
    })
    .catch(() => {
      logger.error("Back button not found");
    });
  await delay(1000);

  const priceTitle = await iframe
    .$eval(tapswapBotSelectors.successClaimMission2M, (el) => el.textContent?.trim())
    .catch(() => logger.error("Go Back without claim"));
  if (typeof priceTitle === "string" && priceTitle === "You've successfully completed the TapSwap cinema mission!") {
    await clickButton(iframe, tapswapBotSelectors.claimPriceButton, "Claim 2m");
  }
};

const extractValue = async (iframe: Frame, selector: string, errorMessage: string): Promise<string> => {
  if (!iframe) {
    logger.error("Iframe not found.", "tapswap");
    return "[None]";
  }

  try {
    const extractedValue = await iframe.$eval(selector, (el) => el.textContent?.trim());
    return extractedValue || "[None]";
  } catch (error) {
    logger.error(errorMessage, "tapswap");
    throw error;
  }
};

const extractBalance = (iframe: Frame) => {
  return extractValue(iframe, tapswapBotSelectors.totalText, "Error extracting balance");
};

const extractTickets = (iframe: Frame) => {
  return extractValue(iframe, tapswapBotSelectors.videoCount, "Error extracting tickets");
};

export default playTapSwap;
