import { Browser } from "puppeteer";
import { logger } from "../core/Logger";
import { AccountResults } from "../types";
import { clickConfirm } from "../utils/confirmPopup";
import { delay } from "../utils/delay";
import { handleClaimTasks, handleOnboardingButtons } from "./pixel";
import { coolClickButton, goBack, reloadBotViaMenu, safeClick, selectFrame } from "../utils/puppeteerHelper";
import { blumBotSelectors, tomatoSelectors } from "../utils/selectors";
import { handleClaimDigReward } from "./tomato";
import { convertToNumber } from "../utils/convertToNumber";

const registerGame = async (browser: Browser, appUrl: string, id: number) => {
  logger.debug(`🎮 register game #${id}`);

  const result: AccountResults = {
    Account: null,
    User: null,
    BalanceBefore: -1,
    BalanceAfter: -1,
    Tickets: -1,
  };

  const page = await browser.newPage();
  const tag = `register game #${id}`;

  try {
    await page.waitForNetworkIdle();

    await Promise.all([page.goto(appUrl), page.waitForNavigation()]);

    await delay(3000);
    await page.bringToFront();
    await clickConfirm(page, tag);
    await delay(5000);

    // TODO: FLOW AFTER REGISTRATION
    if (appUrl.includes("pixel")) {
      await page.bringToFront();
      const iframe = await selectFrame(page, tag);
      await page.bringToFront();
      await handleOnboardingButtons(iframe, 5000, tag);
      await delay(5000);

      await page.bringToFront();
      await handleClaimTasks(iframe, page, tag, true);
    } else if (appUrl.includes("blum")) {
      const iframe = await selectFrame(page, tag);
      await safeClick(iframe, blumBotSelectors.buttonSelector, tag);
      await delay(5000);
      await safeClick(iframe, blumBotSelectors.buttonSelector, tag);
      await delay(5000);
      logger.info("🎮 Blum Game registered successfully", tag);
    } else if (appUrl.toLowerCase().includes("tomarket")) {
      const iframe = await selectFrame(page, tag);
      await coolClickButton(iframe, tomatoSelectors.startEarning, "Start Earning btn", tag);
      await delay(4500);
      await coolClickButton(iframe, tomatoSelectors.newContinue, "Continue btn", tag);
      await delay(2000);
      await coolClickButton(iframe, tomatoSelectors.newEnter, "Enter Button", tag);
      await delay(2000);

      await reloadBotViaMenu(page, tag, true);
      await goBack(page, tag);

      const iframe2 = await selectFrame(page, tag);
      await coolClickButton(iframe2, tomatoSelectors.levelStarBtn, "Level star Button", tag);
      await delay(2000);

      await coolClickButton(iframe2, tomatoSelectors.revealYourLevel, "Reveal Your Level Button", tag);
      await delay(4000);

      await goBack(page, tag);

      await handleClaimDigReward(iframe2, tag);
      await delay(1000);
      await coolClickButton(iframe2, tomatoSelectors.newStartFarming, "Start Farming", tag);

      const getBalance = async (selector: string): Promise<number> => {
        const priceText = await iframe.$eval(selector, (el) => el.textContent);
        return convertToNumber(priceText);
      };
      const balanceAfter = await getBalance(tomatoSelectors.balance);

      result.BalanceBefore = "Registered successful";
      result.BalanceAfter = balanceAfter;
    }
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error.message}`, tag);
  }
  return result;
};

export default registerGame;
