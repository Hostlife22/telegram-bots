import { Browser, ElementHandle, Frame, Page } from "puppeteer";

import { logger } from "../core/Logger";
import { AccountResults } from "../types";
import { commonSelectors, electroBotSelectors } from "../utils/selectors";
import { ensureLoginCheck, safeClick, selectFrame } from "../utils/puppeteerHelper";
import { clickConfirm } from "../utils/confirmPopup";
import { delay } from "../utils/delay";

const coolClickButton = async (iframe: Frame | Page, selector: string, logMessage: string, tag: string) => {
  const elements = await iframe.$$(selector);
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

const autoClicker = async (page: Page | Frame, clicksPerSecond: number) => {
  const intervalMs = 1000 / clicksPerSecond;

  const clickElement = async () => {
    const canvas = await page.$$("#react-unity-webgl-canvas-1");

    if (canvas) {
      canvas[0]?.click();
    } else {
      logger.error("Canvas not found");
    }
  };

  const clickInterval = setInterval(async () => {
    await clickElement();
  }, intervalMs);

  setTimeout(() => clearInterval(clickInterval), 88 * 1000);
};
const handleClaimButtons = async (iframe: Frame, page: Page, tag: string) => {
  const claimButton =
    "div._contentContainer_17q04_262._show_17q04_256 > div._screenContainer_171aw_1._active_171aw_15.undefined > div > div > div > div > div > div._button_1ybqa_1._primary_1ybqa_17";
  const startFarm =
    "div._contentContainer_17q04_262._show_17q04_256 > div._screenContainer_171aw_1._active_171aw_15.false > div > div > div._container_4o2x0_1 > div > div._pointCounterContainer_4o2x0_18._slideInBottom_u90n2_1 > div._progressBarContainer_1h01l_1";

  const predictionButtonUp =
    "div._contentContainer_17q04_262._show_17q04_256 > div._screenContainer_171aw_1._active_171aw_15.false > div > div > div:nth-child(4) > div > div._modalContent_1kyar_46 > div._buttonContainer_1kyar_112 > div._button_1kyar_112._up_1kyar_98";

  const predictionButtonDown =
    "div._contentContainer_17q04_262._show_17q04_256 > div._screenContainer_171aw_1._active_171aw_15.false > div > div > div:nth-child(4) > div > div._modalContent_1kyar_46 > div._buttonContainer_1kyar_112 > div._button_1kyar_112._down_1kyar_101";

  await coolClickButton(iframe, claimButton, "Claim", tag);
  await delay(5000);
  await coolClickButton(iframe, startFarm, "Start farming", tag);
  await delay(3000);
  await coolClickButton(iframe, predictionButtonDown, "prediction down", tag);
  await delay(3000);

  const playGameTab = "div._buttonContainer_17q04_285._showNav_17q04_305 > div._container_zkqhk_1 > button:nth-child(2)";
  await coolClickButton(iframe, playGameTab, "Play Game Tab", tag);
  await delay(3000);
  await autoClicker(iframe, 10);
  await delay(88000);
};

const playElectraGame = async (browser: Browser, appUrl: string, id: number) => {
  logger.debug(`🎮 Electra #${id}`);

  const page = await browser.newPage();
  const tag = `Electra #${id}`;

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

    try {
      await handleClaimButtons(iframe, page, tag);

      //   const [balanceBefore, ticketsBefore] = await Promise.all([extractBalance(iframe, tag), extractTickets(iframe, tag)]);

      //   result.BalanceBefore = balanceBefore;
      //   logger.info(`💰 Starting balance: ${balanceBefore}`, tag);
      //   logger.info(`🎟  Playing ${ticketsBefore} tickets`, tag);

      //   const scriptPath = path.resolve(__dirname, "../injectables/Electra-game.js");

      //   const [balanceAfter, ticketsAfter] = await Promise.all([extractBalance(iframe, tag), extractTickets(iframe, tag)]);

      //   logger.info(`💰 Ending balance: ${balanceAfter}`, tag);
      //   logger.info(`🎟  Remaining tickets: ${ticketsAfter}`, tag);

      //   result.BalanceAfter = balanceAfter;
      //   result.Tickets = ticketsAfter;
    } catch (error) {
      logger.error(`An error occurred during game-play: ${error.message}`, tag);
    } finally {
      // await page.close();
    }
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error.message}`, tag);
  }

  return result;
};

export default playElectraGame;
