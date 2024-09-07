import { Browser } from "puppeteer";

import { AppName, PlayGameFn } from "../types";
import playBlumGame from "./blum";
import playTapSwap from "./tapswap";

export default async function playGame(appName: AppName, browser: Browser, appUrl: string) {
  const gameFunctions: Record<string, PlayGameFn> = {
    blum: playBlumGame,
    // iceberg: playIcebergGame,
    // hamster: playHamsterGame,
    tapswap: playTapSwap,
  };

  const func = gameFunctions[appName];
  if (!func) {
    throw new Error(`[${appName}] is not supported yet`);
  }

  return await func(browser, appUrl);
}
