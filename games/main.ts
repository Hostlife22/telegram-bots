import { Browser } from 'puppeteer';

import playBlumGame from './blum';
import { AppName } from '../types';

export default async function playGame(appName: AppName, browser: Browser, appUrl: string) {
  const gameFunctions = {
    blum: playBlumGame,
    // iceberg: playIcebergGame,
    // hamster: playHamsterGame,
  };

  const func = gameFunctions[appName];
  if (!func) {
    throw new Error(`[${appName}] is not supported yet`);
  }

  return await func(browser, appUrl);
}
