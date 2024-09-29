import { Browser, ElementHandle, Frame, Page, Target } from "puppeteer";
import path from "path";

import { clickConfirm } from "../utils/confirmPopup";
import { convertToNumber } from "../utils/convertToNumber";
import { delay, randomDelay } from "../utils/delay";
import { logger } from "../core/Logger";
import { clickButton, ensureLoginCheck, hasElement, isElementAttached, safeClick, selectFrame } from "../utils/puppeteerHelper";
import {
  blumBotSelectors,
  commonSelectors,
  getBoostPriceSelector,
  pixelGameSelectors,
  tapswapBotSelectors,
} from "../utils/selectors";

interface AccountResults {
  Account: null | string;
  User: null | string;
  BalanceBefore: number | string;
  BalanceAfter: number | string;
}

const playPixelGame = async (browser: Browser, appUrl: string, id: number) => {
  logger.debug(`🎮 Pixel #${id}`);

  const page = await browser.newPage();
  const tag = `pixel #${id}`;

  const result: AccountResults = {
    Account: null,
    User: null,
    BalanceBefore: -1,
    BalanceAfter: -1,
  };

  try {
    await page.waitForNetworkIdle();

    await Promise.all([page.goto(appUrl), page.waitForNavigation()]);
    await delay(20000);

    await page.bringToFront();
    const loginCheck = await ensureLoginCheck(page, tag);
    if (loginCheck) {
      result.BalanceBefore = "Login error";
      result.BalanceAfter = "Login error";
      return result;
    }

    await page.bringToFront();
    await page.waitForSelector(commonSelectors.launchBotButton, { timeout: 30000 });
    await delay(3000);

    await page.bringToFront();
    await safeClick(page, commonSelectors.launchBotButton, tag);
    await clickConfirm(page, tag);

    await page.bringToFront();
    const iframe = await selectFrame(page, tag);

    const wrongUploadingBot = await page.$$(pixelGameSelectors.crashGame);
    if (wrongUploadingBot.length > 0) {
      // await retryReloadBot(page, 3, tag);
    }

    try {
      await handleOnboardingButtons(iframe, 7000, tag);

      const balanceBefore = await extractBalance(iframe, tag);

      result.BalanceBefore = balanceBefore;
      logger.info(`💰 Starting balance: ${balanceBefore}`, tag);
      // logger.info(`🎟  Playing ${ticketsBefore} tickets`, tag);

      const scriptPath = path.resolve(__dirname, "../injectables/pixel-game.js");

      const balance = convertToNumber(balanceBefore);

      if (process.env.CLAIM_PIXEL_TASKS === "true") {
        await handleClaimTasks(iframe, page, tag, true);
      }
      await navigateOnSectionBoostSection(iframe, tag);
      await delay(2000);
      const claimButton = await iframe.$$(pixelGameSelectors.claimSelector).catch(() => {
        logger.error("Claim button not found", tag);
        return [];
      });
      if (claimButton?.length > 0) {
        const claimButtonText = await iframe.$eval(pixelGameSelectors.claimSelector, (el) => el.textContent);
        logger.info(`${claimButtonText}`, tag);
        await claimButton?.[0]
          ?.click()
          .then(() => {
            logger.info("Claim button click", tag);
          })
          .catch(() => {
            logger.error("Claim button not found", tag);
          });
        await delay(1000);
      }

      if (process.env.BOOST_PIXEL === "true") {
        await boostPixelClaimProcess(iframe, tag);
        await delay(1000);
      } else {
        logger.warning("Boost process is disabled or insufficient balance to continue.", tag);
      }
      await goBack(page, iframe, tag);

      const clickCanvasAndPrint = async (iframe: Frame, tag: string) => {
        const canvas = await iframe.$$("#canvasHolder");
        await coolClickButton(canvas, "#canvasHolder", "Canvas", tag);

        const printButton = "div._order_panel_hqiqj_1 > div > button._button_hqiqj_147";
        for (let i = 0; i < 10; i++) {
          const print = await iframe.$$(printButton);
          await coolClickButton(print, printButton, "Print button", tag);
          await delay(1000);
        }
        await delay(2000);
      };

      await clickCanvasAndPrint(iframe, tag);

      const balanceAfter = await extractBalance(iframe, tag);

      logger.info(`💰 Ending balance: ${balanceAfter}`, tag);
      // logger.info(`🎟  Remaining tickets: ${ticketsAfter}`, tag);

      result.BalanceAfter = balanceAfter;
      // result.Tickets = ticketsAfter;
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

const goBack = async (page: Page, iframe: Frame, tag: string) => {
  const fuckingBackButton = await page.$$(commonSelectors.backButton);
  await fuckingBackButton[0]
    .click()
    .then(() => {
      logger.info("Back button click", tag);
    })
    .catch(() => {
      logger.error("Back button not found", tag);
    });
  await delay(1000);
};

enum BoostType {
  Painting = "painting",
  Recharging = "recharging",
  Energy = "energy",
}

const pixelBoostSelectors: Record<BoostType, { priceSelector: string; boostButtonSelector: string }> = {
  [BoostType.Painting]: {
    priceSelector: getBoostPriceSelector(1),
    boostButtonSelector: pixelGameSelectors.boostPaintRewardsSelector,
  },
  [BoostType.Recharging]: {
    priceSelector: getBoostPriceSelector(2),
    boostButtonSelector: pixelGameSelectors.boostRechargingSelector,
  },
  [BoostType.Energy]: {
    priceSelector: getBoostPriceSelector(3),
    boostButtonSelector: pixelGameSelectors.boostEnergyLimitSelector,
  },
};

const boostPixelClaimProcess = async (iframe: Frame, tag: string) => {
  const boostTypes = (process.env.BOOST_PIXEL_TYPE || "").split(",") as BoostType[]; // e.g., "painting,recharging,energy"

  let balance = await extractBalance(iframe, tag);
  logger.info(`Current balance: ${balance}`, tag);

  const getElementPrice = async (selector: string): Promise<number> => {
    const priceText = await iframe.$eval(selector, (el) => el.textContent);
    return convertToNumber(priceText);
  };

  let canContinue = false;

  for (const boostType of boostTypes) {
    if (!(boostType in pixelBoostSelectors)) {
      logger.warning(`Invalid boost type: ${boostType}`, tag);
      continue;
    }

    const { priceSelector, boostButtonSelector } = pixelBoostSelectors[boostType];

    const boostPrice = await getElementPrice(priceSelector);
    logger.info(`Price for ${boostType}: ${boostPrice}`, tag);

    if (convertToNumber(balance) >= boostPrice) {
      const boostButton = await iframe.$$(boostButtonSelector);

      if (boostButton && boostButton.length > 0) {
        await boostButton[0]?.click();
        logger.info(`Clicked on ${boostType} boost button successfully.`, tag);
        await delay(1500);

        const buyBoostButton = await iframe.$$(pixelGameSelectors.buyBoost);
        if (buyBoostButton && buyBoostButton.length > 0) {
          await buyBoostButton[0]?.click();
          logger.info(`Boost for ${boostType} applied successfully.`, tag);

          // Обновление баланса после успешного улучшения
          balance = await extractBalance(iframe, tag);
          logger.info(`Updated balance after boost: ${balance}`, tag);

          // Устанавливаем флаг на повторное выполнение
          canContinue = true;
        } else {
          logger.warning(`Buy button for ${boostType} not found.`, tag);
        }
        await delay(1500);
      } else {
        logger.warning(`Boost button for ${boostType} not found.`, tag);
      }
    } else {
      logger.warning(`Insufficient balance for ${boostType}. Current balance: ${balance}, Required: ${boostPrice}`, tag);
    }
  }

  if (canContinue) {
    logger.info("Enough balance to continue upgrading. Restarting boost process...", tag);
    await boostPixelClaimProcess(iframe, tag);
  } else {
    logger.info("Boost process completed or insufficient balance to continue.", tag);
  }
};

const navigateOnSectionBoostSection = async (iframe: Frame, tag: string) => {
  const navigateOnBoostAndTaskSection = await iframe.$$(pixelGameSelectors.balanceNavigate);
  await navigateOnBoostAndTaskSection[0]?.click().catch(() => {
    logger.warning("Navigate button on task and boosts tab not found", tag);
  });
  await delay(1500);

  const boostButtonSection = await iframe.$$(pixelGameSelectors.boostsSelector);
  await boostButtonSection[0]?.click().catch(() => {
    logger.warning("Boost section navigate button not found", tag);
  });
  await delay(1500);
};

const coolClickButton = async (elements: ElementHandle[], selector: string, logMessage: string, tag: string) => {
  if (elements.length === 0) {
    logger.error(`${logMessage} button not found`, tag);
    return false;
  }
  try {
    await elements[0].click();
    logger.info(`${logMessage} button clicked`, tag);
    return true;
  } catch (error) {
    logger.error(`${logMessage} button not found`, tag);
    return false;
  }
};

export const handleClaimTasks = async (iframe: Frame, page: Page, tag: string, fromInitialScreen = true) => {
  if (fromInitialScreen) {
    const navigateOnBoostAndTaskSection = await iframe.$$(pixelGameSelectors.balanceNavigate);
    if (!(await coolClickButton(navigateOnBoostAndTaskSection, pixelGameSelectors.balanceNavigate, "Navigate", tag))) {
      const settings =
        "body > div:nth-child(8) > div > div._BrowserHeader_m63td_55 > div.scrollable.scrollable-x._BrowserHeaderTabsScrollable_m63td_81.scrolled-start.scrolled-end > div > div._BrowserHeaderTab_m63td_72._active_m63td_157._first_m63td_96.animated-item > button.btn-icon._BrowserHeaderButton_m63td_65._BrowserHeaderTabIcon_m63td_111 > span._BrowserHeaderTabIconInner_m63td_117 > div";
      const elements = await page.$$(settings);
      if (elements.length > 0) {
        logger.info("Clicking on menu button", tag);
        await elements[0].click();
        await delay(1500);
      }
      const rel = "#page-chats > div.btn-menu.contextmenu.bottom-right.active.was-open > div:nth-child(2)";
      const reloads = await page.$$(rel);
      if (reloads.length > 0) {
        logger.info("Clicking on reload button", tag);
        await reloads[0].click();
        await delay(1500);
      }
      await delay(4000);

      const navigateOnBoostAndTaskSection = await iframe.$$(pixelGameSelectors.balanceNavigate);
      await coolClickButton(navigateOnBoostAndTaskSection, pixelGameSelectors.balanceNavigate, "Navigate", tag);
    }
  }
  await delay(2000);

  const claimTask = async (selector: string) => {
    const boostButtonSection = await iframe.$$(selector);
    if (!(await coolClickButton(boostButtonSection, selector, selector, tag))) {
      return;
    }
    await delay(2000);
    await page.bringToFront();
    await delay(1000);

    if (selector.toLowerCase().includes("channel")) {
      const joinChannelButton = await page.$$(pixelGameSelectors.joinChannel);
      await coolClickButton(joinChannelButton, pixelGameSelectors.joinChannel, "Join channel", tag);
      await delay(5000);
    }

    const claimRewardButton = await iframe.$$(selector);
    await coolClickButton(claimRewardButton, selector, `Claim reward ${selector}`, tag);
  };

  for (const task of pixelGameSelectors.tasks) {
    logger.info(`Claiming task: ${task}`, tag);
    await claimTask(task);
  }
};

export const handleOnboardingButtons = async (iframe: Frame, delayTimeout: number = 5000, tag: string): Promise<void> => {
  if (!iframe) {
    logger.error("Iframe not found.", tag);
    return;
  }

  await delay(delayTimeout);

  const fuckingPromiseButton = await iframe.$$(pixelGameSelectors.promiseButton);
  await coolClickButton(fuckingPromiseButton, pixelGameSelectors.promiseButton, "Consent to the user agreement", tag);
  await delay(2000);
  const fuckingGoButton = await iframe.$$(pixelGameSelectors.goButton);
  await coolClickButton(fuckingGoButton, pixelGameSelectors.goButton, "New Pixel Order!", tag);
};

const extractValue = async (iframe: Frame, selector: string, errorMessage: string, tag: string): Promise<string> => {
  if (!iframe) {
    logger.error("Iframe not found.", tag);
    return "[None]";
  }

  try {
    await iframe.waitForSelector(selector, { timeout: 30000 });
    const extractedValue = await iframe.$$eval(selector + " span", (spans) =>
      spans
        .filter((span) => window.getComputedStyle(span).visibility === "visible")
        .map((span) => span.textContent?.trim())
        .join(""),
    );
    return extractedValue || "[None]";
  } catch (error) {
    logger.warning(errorMessage, tag);
    return "[None]";
  }
};

const extractBalance = (iframe: Frame, tag: string) => {
  return extractValue(iframe, pixelGameSelectors.balanceLabel, "Error extracting balance", tag);
};

export default playPixelGame;
