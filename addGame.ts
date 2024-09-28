import fs from "fs";
import path from "path";

export type AccountItem = {
  id: number;
  code: string;
  active: boolean;
  username: string;
  games: Record<string, string>;
};

const updateAdsWithNewGame = (filePath: string, gameKey: string, gameUrl: string): void => {
  const fileContent = fs.readFileSync(filePath, "utf-8");

  const ads: AccountItem[] = JSON.parse(fileContent);

  const updatedAds = ads.map((ad) => {
    if (ad.games[gameKey]) {
      ad.games[gameKey] = gameUrl;
      console.log(`Game "${gameKey}" updated for ad with id ${ad.id}.`);
    } else {
      ad.games[gameKey] = gameUrl;
      console.log(`Game "${gameKey}" added for ad with id ${ad.id}.`);
    }
    return ad;
  });

  fs.writeFileSync(filePath, JSON.stringify(updatedAds, null, 2));

  console.log(`Game "${gameKey}" processed successfully for all ads.`);
};

const args = process.argv.slice(2);

if (args.length < 3) {
  console.error("Please provide a key, value, and JSON file path.");
  process.exit(1);
}

const [newGameKey, newGameUrl, jsonPath] = args;

const filePath = path.join(__dirname, jsonPath);

updateAdsWithNewGame(filePath, newGameKey, newGameUrl);
