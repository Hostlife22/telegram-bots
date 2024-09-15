import { readFile } from "node:fs/promises";
import { TgApp } from "./types";
import { logger } from "./core/Logger";

function findDuplicateAdsCodes(ads: TgApp[]): { code: string; ids: number[] }[] {
  const codeMap: { [key: string]: number[] } = {};
  const duplicates: { code: string; ids: number[] }[] = [];

  ads.forEach((ad) => {
    if (codeMap[ad.code]) {
      codeMap[ad.code].push(ad.id);
    } else {
      codeMap[ad.code] = [ad.id];
    }
  });

  for (const code in codeMap) {
    if (codeMap[code].length > 1) {
      duplicates.push({ code, ids: codeMap[code] });
    }
  }

  return duplicates;
}

async function readAdsInfoFromFile(): Promise<TgApp[]> {
  const filePath = process.env.ACCOUNTS_JSON_PATH || "./data/ads.json";
  const tgApps = await readFile(filePath, "utf8");
  logger.info(`Read from file: ${filePath}`);
  return JSON.parse(tgApps);
}

async function check() {
  try {
    const adsProfiles = await readAdsInfoFromFile();
    const duplicates = findDuplicateAdsCodes(adsProfiles);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate codes found: ${JSON.stringify(duplicates)}`);
    } else {
      logger.info("No duplicates found.");
    }
  } catch (error) {
    logger.error(error.message);
  }
}
check();
