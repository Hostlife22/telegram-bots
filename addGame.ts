import fs from "fs";
import path from "path";

export type AccountItem = {
  id: number;
  code: string;
  active: boolean;
  username: string;
  games: Record<string, string>;
};

const gameUrls = [
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3Dr-0000hl9O",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hloj",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hlLm",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hmHv",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hmHD",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000ho3L",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIrZ",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hItm",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIti",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIv6",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIv3",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIwt",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIwv",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIxW",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIxX",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIzj",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIzr",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIAw",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIAy",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIDL",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIDH",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIFy",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIHm",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIHp",
  "https://web.telegram.org/k/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DTomarket_ai_bot%26appname%3Dapp%26startapp%3D0000hIJ3",
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
  console.error("Please provide a key, JSON file path, and batch size.");
  process.exit(1);
}

const [newGameKey, jsonPath, batchSizeArg] = args;

const filePath = path.join(__dirname, jsonPath);
const batchSize = parseInt(batchSizeArg, 10);

updateAdsWithNewGame(filePath, newGameKey, gameUrls, batchSize);
