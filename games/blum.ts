import { Browser, Frame } from 'puppeteer';
import path from 'path';

import { clickConfirm } from '../utils/confirmPopup';
import { convertToNumber } from '../utils/convertToNumber';
import { delay } from '../utils/delay';
import { logger } from '../logger/logger';
import { selectFrame } from '../utils/puppeteerHelper';

interface AccountResults {
  Account: null | string;
  User: null | string;
  BalanceBefore: number | string;
  BalanceAfter: number | string;
  Tickets: number | string;
}

const playBlumGame = async (browser: Browser, appUrl: string) => {
  logger.debug('🎮 Blum');

  const page = await browser.newPage();

  const result: AccountResults = {
    Account: null,
    User: null,
    BalanceBefore: -1,
    BalanceAfter: -1,
    Tickets: -1,
  };
  const firstButtonSelector = 'div.new-message-bot-commands-view';

  try {
    await page.waitForNetworkIdle();

    await Promise.all([page.goto(appUrl), page.waitForNavigation()]);
    await delay(7000);

    await page.waitForSelector(firstButtonSelector, { timeout: 30000 });
    await delay(5000);
    await page.click(firstButtonSelector);

    await clickConfirm(page, 'blum');

    const iframe = await selectFrame(page, 'blum');

    try {
      await handleClaimButtons(iframe, 15000);
      const [currentBalance, currentTickets] = await Promise.all([extractBalance(iframe), extractTickets(iframe)]);

      logger.info(`💰 Current balance: ${currentBalance}`, 'blum');
      logger.info(`💰 Current tickets: ${currentTickets}`, 'blum');

      const scriptPath = path.resolve(__dirname, '../injectables/blum-game.js');
      const playSelector = 'div.pages-index-drop.drop-zone > div > a';

      const tickets = convertToNumber(currentTickets);
      if (tickets > 0) {
        await iframe.addScriptTag({ path: scriptPath });
        await iframe.$eval(playSelector, (el) => {
          (el as HTMLElement).click();
        });

        await delay(tickets * 35000);

        const continueButtonSelector = 'button.kit-button.is-large.is-primary';
        await iframe.$eval(continueButtonSelector, (el) => {
          (el as HTMLElement).click();
        });

        const [currentBalance, currentTickets] = await Promise.all([extractBalance(iframe), extractTickets(iframe)]);

        logger.info(`💰 Current balance: ${currentBalance}`, 'blum');
        logger.info(`💰 Current tickets: ${currentTickets}`, 'blum');

        result.BalanceAfter = currentBalance;
        result.Tickets = currentTickets;
      } else {
        result.BalanceAfter = currentBalance;
        result.Tickets = currentTickets;
      }
    } catch (error) {
      logger.error(`An error occurred during game-play: ${error}`, 'blum');
    } finally {
      await page.close();
    }
  } catch (error) {
    logger.error(`An error occurred during initial setup: ${error}`, 'blum');
  }

  return result;
};

const handleClaimButtons = async (iframe: Frame, delayTimeout: number = 5000): Promise<void> => {
  if (!iframe) {
    logger.error('Iframe not found.', 'blum');
    return;
  }

  await delay(delayTimeout);

  const continueButtonSelector = 'div.kit-fixed-wrapper > button';
  const claimButtonSelector = 'div.kit-fixed-wrapper > div.index-farming-button > button.kit-button';
  let isAlreadyFraming: boolean = false;

  const clickButton = async (selector: string, type: 'continue' | 'claim' | 'start farming', message: string) => {
    let buttonText = '[None]';
    try {
      buttonText = await iframe.$eval(selector, (el) => {
        const text = (el as HTMLElement).textContent?.trim().toLowerCase() || '[None]';
        (el as HTMLElement).click();
        return text;
      });

      if (buttonText.includes(type)) {
        logger.info(message, 'blum');
      } else if (buttonText.includes('farming')) {
        isAlreadyFraming = true;
        logger.info('Already farming.', 'blum');
      }
    } catch (error) {
      if (type !== 'continue') {
        logger.warning(`No actionable "${type}" button found.`, 'blum');
      }
    } finally {
      await delay(5000);
    }
  };

  await clickButton(continueButtonSelector, 'continue', 'Daily rewards step');
  await clickButton(claimButtonSelector, 'claim', 'Start farming button appeared after claiming. Clicking it...');
  if (!isAlreadyFraming) {
    await clickButton(claimButtonSelector, 'start farming', 'Farming button appeared after claiming. Clicking it...');
  }
};

const extractValue = async (iframe: Frame, selector: string, errorMessage: string): Promise<string> => {
  if (!iframe) {
    logger.error('Iframe not found.', 'blum');
    return '[None]';
  }

  try {
    const extractedValue = await iframe.$eval(selector, (el) => el.textContent?.trim());
    return extractedValue || '[None]';
  } catch (error) {
    logger.error(errorMessage, 'blum');
    throw error;
  }
};

const extractBalance = (iframe: Frame) => {
  const balanceSelector = 'div.profile-with-balance > div.balance > div';
  return extractValue(iframe, balanceSelector, 'Error extracting balance');
};

const extractTickets = (iframe: Frame) => {
  const ticketSelector = 'div.title-with-balance > div.pass';
  return extractValue(iframe, ticketSelector, 'Error extracting tickets');
};

export default playBlumGame;
