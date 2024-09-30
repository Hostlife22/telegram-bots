import puppeteer, { Browser, Frame, Page } from "puppeteer";
import { delay } from "../utils/delay";
import { clickConfirm } from "../utils/confirmPopup";
import { logger } from "../core/Logger";
import { AccountResults } from "../types";
import { coolClickButton, ensureLoginCheck, safeClick, selectFrame } from "../utils/puppeteerHelper";
import { commonSelectors, tomatoSelectors } from "../utils/selectors";
import { convertToNumber } from "../utils/convertToNumber";

export const handleClaimButtons = async (iframe: Frame, tag: string): Promise<void> => {
  await coolClickButton(iframe, tomatoSelectors.continueButton, "continue button", tag);
  await delay(5000);
  await coolClickButton(iframe, tomatoSelectors.claimButton, "claim button", tag);
  await delay(5000);
  await coolClickButton(iframe, tomatoSelectors.startFarmingButton, "start farming", tag);
};

const handleClaimDigReward = async (iframe: Frame, tag: string): Promise<void> => {
  await coolClickButton(iframe, tomatoSelectors.diggerButton, "open digger reward modal", tag);
  await delay(3000);

  const getRewardButtons = await iframe.$$(tomatoSelectors.claimDigReward);
  if (getRewardButtons?.length > 0) {
    logger.info("clicking claim button");
    await getRewardButtons[0]?.click();
  }
  await delay(2000);
  await coolClickButton(iframe, tomatoSelectors.closeDiggerModal, "claim rewards", tag);
  await delay(2000);
};

const playTomatoGame = async (browser: Browser, appUrl: string, id: number) => {
  logger.debug(`🍅 register game #${id}`);

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

    await handleClaimButtons(iframe, tag);
    await delay(2000);
    await handleClaimDigReward(iframe, tag);
    await delay(2000);

    const getBalance = async (selector: string): Promise<number> => {
      const priceText = await iframe.$eval(selector, (el) => el.textContent);
      return convertToNumber(priceText);
    };
    const balanceAfter = await getBalance(tomatoSelectors.balance);

    result.BalanceAfter = balanceAfter;
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error.message}`, tag);
  }
  return result;
};

export default playTomatoGame;
