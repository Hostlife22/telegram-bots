import { readFile, writeFile } from "node:fs/promises";
import { TgApp } from "./types";
import { logger } from "./core/Logger";
import dotenv from "dotenv";
import path from "path";

const env = process.env.NODE_ENV || "pixel";

dotenv.config({
  path: path.resolve(__dirname, `.${env}.env`),
});

function findDuplicates(ads: TgApp[]): { id: number[]; code: { code: string; ids: number[] }[] } {
  const codeMap: { [key: string]: number[] } = {};
  const idSet: Set<number> = new Set();
  const duplicateIds: number[] = [];
  const duplicateCodes: { code: string; ids: number[] }[] = [];

  ads.forEach((ad) => {
    if (idSet.has(ad.id)) {
      duplicateIds.push(ad.id);
    } else {
      idSet.add(ad.id);
    }

    if (codeMap[ad.code]) {
      codeMap[ad.code].push(ad.id);
    } else {
      codeMap[ad.code] = [ad.id];
    }
  });

  for (const code in codeMap) {
    if (codeMap[code].length > 1) {
      duplicateCodes.push({ code, ids: codeMap[code] });
    }
  }

  return { id: duplicateIds, code: duplicateCodes };
}

async function readAdsInfoFromFile(): Promise<TgApp[]> {
  const filePath = process.env.ACCOUNTS_JSON_PATH || "./data/ads.json";
  const tgApps = await readFile(filePath, "utf8");
  logger.info(`Read from file: ${filePath}`);
  return JSON.parse(tgApps);
}

async function writeSortedAdsToFile(adsProfiles: TgApp[]): Promise<void> {
  const filePath = process.env.ACCOUNTS_JSON_PATH || "./data/ads.json";
  const sortedAds = JSON.stringify(adsProfiles, null, 2);
  await writeFile(filePath, sortedAds, "utf8");
  logger.info(`File rewritten in sorted order: ${filePath}`);
}

async function check() {
  try {
    const adsProfiles = await readAdsInfoFromFile();

    adsProfiles.sort((a, b) => a.id - b.id);

    const { id: duplicateIds, code: duplicateCodes } = findDuplicates(adsProfiles);

    if (duplicateIds.length > 0 || duplicateCodes.length > 0) {
      const errorMsg = `Duplicate ids found: ${JSON.stringify(duplicateIds)}; Duplicate codes found: ${JSON.stringify(duplicateCodes)}`;
      throw new Error(errorMsg);
    } else {
      logger.info("No duplicates found.");
    }

    await writeSortedAdsToFile(adsProfiles);
  } catch (error) {
    logger.error(error.message);
  }
}

check();
