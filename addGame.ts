import fs from "fs";
import path from "path";

export type AccountItem = {
  id: number;
  code: string;
  active: boolean;
  username: string;
  games: Record<string, string>;
};

// 141 - 187
const defaultGameUrls = [
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIRK",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIRW",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hISX",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIT0",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hITK",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hITV",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIUT",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIUK",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIVy",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIVz",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIWD",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIWF",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIXt",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIXd",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIY1",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIY5",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIYM",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIYP",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIZw",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIZy",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hJ0y",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hJ0w",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hJ15",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hJ1g",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hJ1Z",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hJ21",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hJ2u",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hJ2A",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSpv",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSqT",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSwg",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSwb",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSAS",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSAc",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSEU",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSEX",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSIP",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSIY",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSNc",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSNd",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSQW",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSQN",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hSVg",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D00008R2v",
  // "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3Dnotpixel%26appname%3Dapp%26startapp%3Df294001568_t",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3Dnotpixel%26appname%3Dapp%26startapp%3Df1621573108_t",
];

const updateAdsWithNewGame = (filePath: string, gameKey: string, gameUrls: string[], batchSize: number): void => {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const ads: AccountItem[] = JSON.parse(fileContent);
  const totalAds = ads.length;

  const batches = Array.from({ length: Math.ceil(totalAds / batchSize) }, (_, index) => {
    return ads.slice(index * batchSize, (index + 1) * batchSize);
  });

  batches.forEach((batch, batchIndex) => {
    const gameUrl = gameUrls[batchIndex] || gameUrls[gameUrls.length - 1];

    const updatedBatch = batch.map((ad) => {
      ad.games[gameKey] = gameUrl;
      console.log(
        `Game "${gameKey}" with URL "${gameUrl.slice(gameUrl.length - 12)}" added for ad with id ${ad.id} in batch ${batchIndex + 1}.`,
      );
      return ad;
    });

    ads.splice(batchIndex * batchSize, updatedBatch.length, ...updatedBatch);
  });

  fs.writeFileSync(filePath, JSON.stringify(ads, null, 2));
  console.log(`Game "${gameKey}" added successfully in batches of ${batchSize} profiles.`);
};

const args = process.argv.slice(2);

if (args.length < 3) {
  console.error("Please provide a key, JSON file path, batch size, and optionally game URLs as a single string.");
  process.exit(1);
}

const [newGameKey, jsonPath, batchSizeArg, gameUrlsStr] = args;

const filePath = path.join(__dirname, jsonPath);
const batchSize = parseInt(batchSizeArg, 10);

const gameUrls = gameUrlsStr ? gameUrlsStr.split(",") : defaultGameUrls;

updateAdsWithNewGame(filePath, newGameKey, gameUrls, batchSize);
