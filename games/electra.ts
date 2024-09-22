import { Browser, Frame, Page } from "puppeteer";

import { logger } from "../core/Logger";
import { AccountResults } from "../types";
import { commonSelectors, electroBotSelectors } from "../utils/selectors";
import { ensureLoginCheck, safeClick, selectFrame } from "../utils/puppeteerHelper";
import { clickConfirm } from "../utils/confirmPopup";
import { delay } from "../utils/delay";

const clickOnReward = async () => {
  const attractionItem = document.querySelector(electroBotSelectors.collectRewardButton);

  if (attractionItem) {
    // @ts-ignore
    attractionItem?.click();
    logger.info(`Clicked on fucking collect reward`, "Collect reward");
  } else {
    logger.info("Attraction item not found");
  }
};

const handleClaimButtons = async (iframe: Frame, page: Page, tag: string) => {
  await safeClick(iframe, "div._button_1ybqa_1", "reward");
  const fuckingConfirmButton = await iframe.$$("div._button_1ybqa_1");
  console.log(fuckingConfirmButton);
  await fuckingConfirmButton[0]?.click().then(() => {
    console.log("FF", "clicked");
  });

  await clickOnReward();

  await iframe.$eval(electroBotSelectors.collectRewardButton, (el) => {
    console.log(el.textContent);
  });
  await safeClick(iframe, electroBotSelectors.startFarmingButton, "start farm");
  await safeClick(page, electroBotSelectors.startFarmingButton, "start farm2");

  logger.info(`Found ${electroBotSelectors.collectRewardButton} collect reward button`, tag);
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
