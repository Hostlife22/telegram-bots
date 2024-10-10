import puppeteer, { Browser, Frame, Page } from "puppeteer";
import { delay, randomDelay } from "../utils/delay";
import { clickConfirm } from "../utils/confirmPopup";
import { logger } from "../core/Logger";
import { AccountResults } from "../types";
import { coolClickButton, ensureLoginCheck, safeClick, selectFrame } from "../utils/puppeteerHelper";
import { commonSelectors, tomatoSelectors } from "../utils/selectors";
import { convertToNumber, parseStringToNumber } from "../utils/convertToNumber";

export const handleClaimButtons = async (iframe: Frame, tag: string): Promise<void> => {
  await coolClickButton(iframe, tomatoSelectors.newContinue, "Continue button", tag);
  await delay(3000);
  await coolClickButton(iframe, tomatoSelectors.newEnter, "Enter button", tag);
  await delay(3000);
  await coolClickButton(iframe, tomatoSelectors.newClaim, "Claim button", tag);
  await delay(5000);
  await coolClickButton(iframe, tomatoSelectors.newClaim, "Start farming", tag);
};

const handleClaimDigReward = async (iframe: Frame, tag: string): Promise<void> => {
  await coolClickButton(iframe, tomatoSelectors.diggerButton, "open digger reward modal", tag);
  await randomDelay(800, 1000, "ms");

  const getRewardButtons = await iframe?.$$(tomatoSelectors.claimDigReward);
  if (getRewardButtons?.length > 0) {
    logger.info("clicking claim button");
    await getRewardButtons[0]?.click();
  } else {
    logger.warning("no reward to claim");
  }
  await randomDelay(800, 1000, "ms");
  await coolClickButton(iframe, tomatoSelectors.closeDiggerModal, "claim rewards", tag);
  await randomDelay(800, 1000, "ms");
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
  await randomDelay(800, 1000, "ms");
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

    await page.bringToFront();
    await page.waitForSelector(commonSelectors.launch2, { timeout: 30000 });
    await randomDelay(800, 1000, "ms");

    await page.bringToFront();
    await safeClick(page, commonSelectors.launchBotButton, tag);
    await coolClickButton(page, commonSelectors.launch2, "Launch 2 option", tag);
    await clickConfirm(page, tag);

    await page.bringToFront();
    const iframe = await selectFrame(page, tag);

    await handleClaimButtons(iframe, tag);
    await randomDelay(800, 1000, "ms");
    await handleClaimDigReward(iframe, tag);
    await delay(2000);

    await coolClickButton(iframe, tomatoSelectors.spinModalOpenButton, "Open spinner button", tag);

    await delay(7000);
    const label = await iframe.$eval(
      "div._button_wzwhq_68._buttonSmall_wzwhq_93._buttonSpinTg_wzwhq_145._buttonSmallBlue_wzwhq_176 > div > div._tip_1tkeu_1",
      (el) => el.textContent,
    );

    logger.info(`label: ${label}`);
    const spinCount = parseStringToNumber(label);

    if (spinCount > 0) {
      for (let i = 0; i < spinCount; i++) {
        await coolClickButton(
          iframe,
          "div._button_wzwhq_68._buttonSmall_wzwhq_93._buttonSpinTg_wzwhq_145._buttonSmallBlue_wzwhq_176",
          "Run spin button",
          tag,
        );
        await delay(6000);
      }
    }
    await delay(5000);
    await goBack(page, iframe, tag);

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
