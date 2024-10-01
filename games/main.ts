import { Browser } from "puppeteer";

import { AppName, PlayGameFn } from "../types";
import playBlumGame from "./blum";
import playPixelGame from "./pixel";
import playTapSwap from "./tapswap";
import playElectraGame from "./electra";
import registerGame from "./register";

export default async function playGame(appName: AppName, browser: Browser, appUrl: string, id: number) {
  const gameFunctions: Record<string, PlayGameFn> = {
    pixel: playPixelGame,
    blum: playBlumGame,
    tapswap: playTapSwap,
    electra: playElectraGame,
    register: registerGame,
  };

  const func = gameFunctions[appName];
  if (!func) {
    throw new Error(`[${appName}] is not supported yet`);
  }

  return await func(browser, appUrl, id);
}
