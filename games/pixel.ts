import { Browser, ElementHandle, Frame, Page, Target } from "puppeteer";
import path from "path";

import { clickConfirm } from "../utils/confirmPopup";
import { convertToNumber } from "../utils/convertToNumber";
import { delay, randomDelay } from "../utils/delay";
import { logger } from "../core/Logger";
import { hasElement, reloadBotViaMenu, safeClick, selectFrame } from "../utils/puppeteerHelper";
import { commonSelectors, getBoostPriceSelector, pixelGameSelectors } from "../utils/selectors";
import { pixelDiffToPixelClickMap } from "../utils/pixelDiffToPixelClickMap";
import { existedCoordinates } from "../utils/existedCoordinates";
import { pixelStore } from "../core/PixelDifferenceStore";

interface AccountResults {
  Account: null | string;
  User: null | string;
  BalanceBefore: number | string;
  BalanceAfter: number | string;
}

const randomElementClickButton = async (elements: ElementHandle[], logMessage: string, tag: string) => {
  if (elements.length === 0) {
    logger.error(`${logMessage} button not found`, tag);
    return false;
  }
  try {
    const element = elements[0];
    const boundingBox = await element.boundingBox();
    if (!boundingBox) {
      logger.error(`${logMessage} button bounding box not found`, tag);
      return false;
    }

    const randomX = boundingBox.x + boundingBox.width * 0.25 + Math.random() * boundingBox.width * 0.5;
    const randomY = boundingBox.y + boundingBox.height * 0.25 + Math.random() * boundingBox.height * 0.5;

    await element.click({ offset: { x: randomX - boundingBox.x, y: randomY - boundingBox.y } });
    logger.info(`${logMessage} button clicked at (${randomX}, ${randomY})`, tag);
    return true;
  } catch (error) {
    logger.error(`${logMessage} button not found`, tag);
    return false;
  }
};

const simpleParse = async (slice: number) => {
  const pixels = pixelDiffToPixelClickMap(pixelStore.differences);
  return pixels.slice(0, slice);
};

const pickColor = async (iframe: Frame, requiredColor: string, tag: string) => {
  try {
    const openModalTrigger = await iframe.$$("div._info_hqiqj_42 > div._active_color_hqiqj_51");

    if ((await openModalTrigger[0].evaluate((el) => el.getAttribute("style"))).includes(requiredColor)) {
      logger.info(`Color ${requiredColor} already selected`, tag);
      return;
    }
    if (openModalTrigger.length === 0) {
      logger.error("Color picker not found", tag);
      return;
    }

    await openModalTrigger[0]?.click();
    await delay(200);

    const colors = await iframe.$$(pixelGameSelectors.colors);
    if (colors.length === 0) {
      logger.error("Color picker not found", tag);
      return;
    }
    const backGroundStyles = await iframe.$$eval(pixelGameSelectors.colors, (el) => {
      return el.map((element) => element.getAttribute("style"));
    });

    const colorIndex = backGroundStyles.findIndex((style) => style?.includes(requiredColor));
    if (colorIndex === -1) {
      logger.error("Color not found", tag);
      return;
    }

    await colors[colorIndex].click();
    await randomDelay(200, 400, "ms");
    await openModalTrigger[0]?.click();
  } catch (e) {
    logger.error(`Color picker not found ${e.message}`, tag);
  }
};

const wrongUploadingBot = async (iframe: Frame, page: Page, tag: string) => {
  const wrongUploadingBot = await iframe.$$(pixelGameSelectors.crashGameButton);
  if (wrongUploadingBot.length > 0) {
    logger.warning("Bot is uploading wrong, reload bot...", tag);
    await reloadBotViaMenu(page, tag, false);
    await randomDelay(3000, 5000, "ms");
  }
};

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
    const initialFrame = await selectFrame(page, tag);
    await wrongUploadingBot(initialFrame, page, tag);
    await wrongUploadingBot(initialFrame, page, tag);
    await wrongUploadingBot(initialFrame, page, tag);

    if ((await initialFrame.$$(pixelGameSelectors.crashGameButton)).length > 0) {
      logger.error(`Finish game with Uploading Error`);
      await page.close();
      return {
        ...result,
        BalanceBefore: "Bot is uploading wrong after 3 reloads",
      };
    }

    try {
      const iframe = await selectFrame(page, tag);
      await handleOnboardingButtons(iframe, 7000, tag);

      let balanceBefore = await extractBalance(iframe, tag);

      if (balanceBefore === "0") {
        logger.warning("Balance is 0. Exiting...", tag);
        await reloadBotViaMenu(page, tag, false);
        await delay(3000);
        balanceBefore = await extractBalance(iframe, tag);
      }

      if (balanceBefore === "[None]") {
        logger.warning("Balance is None. Trying reload bot...", tag);
        await reloadBotViaMenu(page, tag, false);
        await randomDelay(3000, 4000, "ms");
        balanceBefore = await extractBalance(iframe, tag);
      }

      result.BalanceBefore = balanceBefore;
      logger.info(`💰 Starting balance: ${balanceBefore}`, tag);

      const scriptPath = path.resolve(__dirname, "../injectables/pixel-game.js");

      const balance = convertToNumber(balanceBefore);

      if (process.env.CLAIM_PIXEL_TASKS === "true") {
        await handleClaimTasks(iframe, page, tag, true);
        await delay(2000);
      }

      // await checkSelectedTemplate(iframe, tag);

      await coolClickButton(await iframe.$$(pixelGameSelectors.minusZoom), pixelGameSelectors.minusZoom, "Play button", tag);
      await delay(1000);
      await coolClickButton(await iframe.$$(pixelGameSelectors.minusZoom), pixelGameSelectors.minusZoom, "Play button", tag);
      await delay(1000);
      await coolClickButton(await iframe.$$(pixelGameSelectors.minusZoom), pixelGameSelectors.minusZoom, "Play button", tag);
      await delay(1000);

      await defaultGamePlay(iframe, page, tag);

      const balanceAfter = await extractBalance(iframe, tag);

      logger.info(`💰 Ending balance: ${balanceAfter}`, tag);

      result.BalanceAfter = balanceAfter;
    } catch (error) {
      logger.error(`An error o ccurred during game-play: ${error.message}`, tag);
    } finally {
      await page.close();
    }
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error.message}`, tag);
  }

  return result;
};

function canvasToPuppeteerOffset(canvasCoords: { x: number; y: number }) {
  return {
    x: existedCoordinates.find((coord) => coord.canvas.x === canvasCoords.x).puppeteer.x,
    y: existedCoordinates.find((coord) => coord.canvas.y === canvasCoords.y).puppeteer.y,
  };
}

async function clickOnCanvasByCoordinate(
  iframe: Frame,
  canvas: ElementHandle,
  coordinates: { x: number; y: number },
  tag: string,
) {
  try {
    const result = canvasToPuppeteerOffset({ x: coordinates?.x, y: coordinates?.y });

    await canvas?.click({ offset: { x: result?.x, y: result?.y } });
    const positionLabel = await iframe.$eval(
      "div._info_hqiqj_42 > div._pixel_info_container_hqiqj_61 > div._pixel_info_text_hqiqj_75",
      (el) => el.textContent,
    );
    logger.info(
      `Clicked on canvas(${coordinates?.x}, ${coordinates?.y}), puppeteer (${result?.x}, ${result?.y}) with label ${positionLabel})`,
      tag,
    );
    return result;
  } catch (error) {
    logger.error(`Error clicking on canvas: ${error.message}`, tag);
    return null;
  }
}

const checkSelectedTemplate = async (iframe: Frame, tag: string) => {
  const IMG_TEMPLATE_URL = process.env.IMG_TEMPLATE_URL;

  if (!IMG_TEMPLATE_URL) {
    throw new Error("IMG_TEMPLATE_URL is not defined in the environment variables.");
  }

  let isSelecting = false;
  try {
    const buttons = await iframe.$$("div._buttons_container_b4e6p_17 > button");

    for (const button of buttons) {
      const img = await button.$("img._image_wekpw_19");
      if (img) {
        const src = await img.evaluate((el: HTMLImageElement) => el.src);
        if (src === IMG_TEMPLATE_URL) {
          logger.info(`Template with url ${IMG_TEMPLATE_URL} is already selected`, tag);
          isSelecting = true;
        }
      }
    }
    if (!isSelecting) {
      logger.info(`Template with url ${IMG_TEMPLATE_URL} is not selected`, tag);
      logger.debug(`Start selecting template with url ${IMG_TEMPLATE_URL}`, tag);
      await selectTemplate(iframe, tag);
    }
  } catch (error) {
    logger.error("An error occurred while selecting the template:", tag);
  }
};

export const closeBotViaMenu = async (page: Page, tag: string, menuItem: number) => {
  const settings =
    "body > div:nth-child(8) > div > div._BrowserHeader_m63td_55 > div.scrollable.scrollable-x._BrowserHeaderTabsScrollable_m63td_81.scrolled-start.scrolled-end > div > div._BrowserHeaderTab_m63td_72._active_m63td_157 > button.btn-icon._BrowserHeaderButton_m63td_65._BrowserHeaderTabIcon_m63td_111 > span._BrowserHeaderTabIconInner_m63td_117 > div";

  const elements = await page.$$(settings);
  if (elements.length > 0) {
    logger.info("Clicking on menu button", tag);
    await elements[0].click();
    await delay(1500);
  }

  const closeBtnItem = `#page-chats > div.btn-menu.contextmenu.bottom-right.active.was-open > div:nth-child(${menuItem})`;
  const closeBtn = await page.$$(closeBtnItem);
  if (closeBtn.length > 0) {
    logger.info("Clicking on reload button", tag);
    await closeBtn[0].click();
    await delay(1500);
    await clickConfirm(page, tag);
  }
};

const selectTemplate = async (iframe: Frame, tag: string) => {
  const BURGER_BUTTON_SELECTOR =
    "#root > div > div._header_dwodb_1 > div > div._buttons_container_1tu7a_1 > div._group_1tu7a_8._left_1tu7a_15 > button._burger_button_1tu7a_65";
  const MY_TEMPLATES_BUTTON_SELECTOR = "#root > div > nav > div._top_container_12qyz_10 > ul > li:nth-child(4)";
  const CATALOG_BUTTON_SELECTOR =
    "#root > div > div._layout_q8u4d_1 > div._content_q8u4d_22 > div._panel_1mia4_1 > div:nth-child(2)";
  const LOAD_MORE_BUTTON_SELECTOR =
    "#root > div > div._layout_q8u4d_1 > div._content_q8u4d_22 > div._info_layout_1p9dg_1 > div > div._button_container_94gj5_11 > button";
  const SELECT_TEMPLATE_BUTTON_SELECTOR = "body > div._layout_16huv_1 > div > div > div > button";
  const NOT_BUTTON_SELECTOR = "body > div._layout_16huv_1 > div > div > div > div._not_button_13ays_92";
  const CLOSE_TEMPLATE_BUTTON_SELECTOR = "body > div._layout_16huv_1 > div > div > div > div._close_button_13ays_18";
  const RETURN_BUTTON_SELECTOR = "#root > div > div._layout_q8u4d_1 > button";

  try {
    const burgerButton = await iframe.$$(BURGER_BUTTON_SELECTOR);
    await coolClickButton(burgerButton, BURGER_BUTTON_SELECTOR, "Burger Button", tag);
    await delay(2000);

    const myTemplatesButton = await iframe.$$(MY_TEMPLATES_BUTTON_SELECTOR);
    await coolClickButton(myTemplatesButton, MY_TEMPLATES_BUTTON_SELECTOR, "My Templates Button", tag);
    await delay(2000);

    const catalogButton = await iframe.$$(CATALOG_BUTTON_SELECTOR);
    await coolClickButton(catalogButton, CATALOG_BUTTON_SELECTOR, "Catalog Button", tag);
    await delay(5000);

    let templateFound = false;
    let index = 1;
    const maxIndex = 240;

    while (!templateFound && index <= maxIndex) {
      while (true) {
        const currentSelector = `#root > div > div._layout_q8u4d_1 > div._content_q8u4d_22 > div._info_layout_1p9dg_1 > div > div._container_94gj5_5 > div:nth-child(${index}) > div > img`;
        const templateButton = await iframe.$(currentSelector);

        if (templateButton) {
          const imgSrc = await templateButton.evaluate((img: HTMLImageElement) => img.src);
          if (imgSrc === process.env.IMG_TEMPLATE_URL) {
            const parentDivSelector = `#root > div > div._layout_q8u4d_1 > div._content_q8u4d_22 > div._info_layout_1p9dg_1 > div > div._container_94gj5_5 > div:nth-child(${index})`;
            await coolClickButton(await iframe.$$(parentDivSelector), parentDivSelector, "Template Button", tag);
            await delay(2000);
            templateFound = true;
            break;
          }
        } else {
          break;
        }

        index++;
      }

      if (!templateFound) {
        const loadMoreButton = await iframe.$$(LOAD_MORE_BUTTON_SELECTOR);
        await coolClickButton(loadMoreButton, LOAD_MORE_BUTTON_SELECTOR, "Load More Button", tag);
        await delay(3000);
      }
    }

    for (let i = 0; i < 5; i++) {
      const selectTemplateButton = await iframe.$$(SELECT_TEMPLATE_BUTTON_SELECTOR);
      await coolClickButton(selectTemplateButton, SELECT_TEMPLATE_BUTTON_SELECTOR, "Select Template Button", tag);
      await delay(5000);

      try {
        await iframe.waitForSelector(NOT_BUTTON_SELECTOR, { timeout: 3000 });
        break;
      } catch {}
    }

    const closeTemplateButton = await iframe.$$(CLOSE_TEMPLATE_BUTTON_SELECTOR);
    await coolClickButton(closeTemplateButton, CLOSE_TEMPLATE_BUTTON_SELECTOR, "Close Template Button", tag);
    await delay(2000);

    const returnButton = await iframe.$$(RETURN_BUTTON_SELECTOR);
    await coolClickButton(returnButton, RETURN_BUTTON_SELECTOR, "Return Button", tag);
  } catch (error) {
    logger.error(`An error occurred during the template selection process: ${error}`, tag);
  }
};

export const defaultGamePlay = async (iframe: Frame, page: Page, tag: string) => {
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

  await clickCanvasAndPrint(iframe, tag);
};

const clickCanvasAndPrint = async (iframe: Frame, tag: string) => {
  const canvas = await iframe.$$("#canvasHolder");
  await randomElementClickButton(canvas, "Canvas", tag);
  await randomDelay(800, 1000, "ms");

  for (let i = 0; i < 50; i++) {
    const parsedPixels = await simpleParse(35);
    console.log(`${i} - pix`, parsedPixels[i], tag);
    const print = await iframe.$$(pixelGameSelectors.printButton);

    logger.debug(`required color ${parsedPixels[i].color}`, tag);

    await pickColor(iframe, parsedPixels[i].color, tag);

    const coordinateClick = await clickOnCanvasByCoordinate(iframe, canvas[0], parsedPixels[i], tag);

    logger.info(`Coordinate ${coordinateClick?.x}, ${coordinateClick?.y}`, tag);
    await delay(500);
    const result = await coolClickButton(print, pixelGameSelectors.printButton, "Print button", tag);
    if (!result) {
      break;
    }
    await randomDelay(800, 1000, "ms");
  }
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
    const priceText = await iframe
      .$eval(selector, (el) => el.textContent)
      .then((text) => text || "1000000")
      .catch(() => "1000000");

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

const ensureLoginCheck = async (page: Page, tag: string) => {
  const isAuthPage = await hasElement(page, commonSelectors.authLoginPage);

  if (isAuthPage) {
    logger.warning("Telegram Web account is not authorized", tag);
    await page.close();
  }

  return isAuthPage;
};

export const coolClickButton = async (elements: ElementHandle[], selector: string, logMessage: string, tag: string) => {
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
      await reloadBotViaMenu(page, tag, false);

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

    // const joinChannelButton = await page.$$(pixelGameSelectors.joinChannel);
    // await coolClickButton(joinChannelButton, pixelGameSelectors.joinChannel, "Join channel", tag);
    if (selector.toLowerCase().includes("channel")) {
      const subscribeChButton = await page.$$(pixelGameSelectors.joinNotCoinChannel);
      await coolClickButton(subscribeChButton, pixelGameSelectors.joinNotCoinChannel, "Join channel", tag);
      await delay(3000);

      const subscribeComButton = await page.$$(pixelGameSelectors.joinNotCoinCommunity);
      await coolClickButton(subscribeComButton, pixelGameSelectors.joinNotCoinCommunity, "Join community", tag);
      await delay(2000);
    }
    const claimRewardButton = await iframe.$$(selector);
    await coolClickButton(claimRewardButton, selector, `Claim reward ${selector}`, tag);
  };

  for (const task of pixelGameSelectors.tasks) {
    logger.info(`Claiming task: ${task}`, tag);
    await claimTask(task);
  }

  if (process.env.CLAIM_JOY === "true") {
    for (let index = 0; index < 5; index++) {
      if (!(await hasElement(iframe, pixelGameSelectors.joiNotCompleted))) break;

      const joyButtonTaskOpenBtn = await iframe.$$(pixelGameSelectors.joiBotButton);
      await coolClickButton(joyButtonTaskOpenBtn, pixelGameSelectors.joiBotButton, "Open joy button", tag);
      await delay(2000);

      if (index === 0) {
        await clickConfirm(page, tag);
        await delay(5000);
        await closeBotViaMenu(page, tag, 3);
        await delay(2000);
      } else {
        await clickConfirm(page, tag, false);
        await delay(2000);
      }

      await coolClickButton(joyButtonTaskOpenBtn, pixelGameSelectors.joiBotButton, "Claim joy button", tag);
      await delay(3000);
    }
  }

  await goBack(page, iframe, tag);
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

export const extractBalance = (iframe: Frame, tag: string) => {
  return extractValue(iframe, pixelGameSelectors.balanceLabel, "Error extracting balance", tag);
};

export default playPixelGame;
