import { Browser } from "puppeteer";

import { AppName, PlayGameFn } from "../types";
import playBlumGame from "./blum";
import playTapSwap from "./tapswap";
import playElectraGame from "./electra";

export default async function playGame(appName: AppName, browser: Browser, appUrl: string, id: number) {
  const gameFunctions: Record<AppName, PlayGameFn> = {
    blum: playBlumGame,
    tapswap: playTapSwap,
    electra: playElectraGame,
  };

  const func = gameFunctions[appName];
  if (!func) {
    throw new Error(`[${appName}] is not supported yet`);
  }

  return await func(browser, appUrl, id);
}
