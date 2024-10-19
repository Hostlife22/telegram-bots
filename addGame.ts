import fs from "fs";
import path from "path";

export type AccountItem = {
  id: number;
  code: string;
  active: boolean;
  username: string;
  games: Record<string, string>;
};

const updateAdsWithNewGame = (filePath: string, gameKey: string, gameUrl: string, idsToUpdate: number[]): void => {
  const fileContent = fs.readFileSync(filePath, "utf-8");

  const ads: AccountItem[] = JSON.parse(fileContent);

  const updatedAds = ads.map((ad) => {
    if (idsToUpdate.includes(ad.id)) {
      if (ad.games[gameKey]) {
        ad.games[gameKey] = gameUrl;
        console.log(`Game "${gameKey}" updated for ad with id ${ad.id}.`);
      } else {
        ad.games[gameKey] = gameUrl;
        console.log(`Game "${gameKey}" added for ad with id ${ad.id}.`);
      }
    }
    return ad;
  });

  fs.writeFileSync(filePath, JSON.stringify(updatedAds, null, 2));

  console.log(`Game "${gameKey}" processed successfully for selected ads.`);
};

const args = process.argv.slice(2);

if (args.length < 4) {
  console.error("Please provide a key, value, JSON file path, and at least one ID.");
  process.exit(1);
}

const [newGameKey, newGameUrl, jsonPath, ...idArgs] = args;

const filePath = path.join(__dirname, jsonPath);

const idsToUpdate: number[] = idArgs.flatMap((idArg) => {
  if (idArg.includes("-")) {
    const [start, end] = idArg.split("-").map(Number);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  return [Number(idArg)];
});

updateAdsWithNewGame(filePath, newGameKey, newGameUrl, idsToUpdate);
