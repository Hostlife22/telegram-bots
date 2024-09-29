import puppeteer, { Browser, Frame, Page } from "puppeteer";
import { delay } from "../utils/delay";
import { clickConfirm } from "../utils/confirmPopup";
import { logger } from "../core/Logger";
import { AccountResults } from "../types";
import { coolClickButton, ensureLoginCheck, safeClick, selectFrame } from "../utils/puppeteerHelper";
import { commonSelectors, tomatoSelectors } from "../utils/selectors";

const findTotalAndTicketAmount = async (iframe: Frame): Promise<{ savedTotal: string; ticketAmount: string }> => {
  try {
    const textSelector = "div._home_cu9cz_1 > div._score_vt6yl_1";
    const ticketSelector = "div._board_pnata_1 > div._boardTickets_pnata_160";

    const savedTotal = (await iframe?.$eval(textSelector, (el) => el.textContent ?? "")) || "";
    const ticketAmount = (await iframe?.$eval(ticketSelector, (el) => el.textContent ?? "")) || "";

    return { savedTotal, ticketAmount };
  } catch (error) {
    console.error("Error finding total and ticket amount:", error);
    return { savedTotal: "", ticketAmount: "" };
  }
};

export const handleClaimButtons = async (iframe: Frame, tag: string): Promise<void> => {
  await coolClickButton(iframe, tomatoSelectors.continueButton, "continue button", tag);
  await delay(3000);
  await coolClickButton(iframe, tomatoSelectors.claimButton, "claim button", tag);
  await delay(2000);
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
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error.message}`, tag);
  }
  return result;
};

export default playTomatoGame;
