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
    if (!ad.games[gameKey]) {
      ad.games[gameKey] = gameUrl;
    }
    return ad;
  });

  fs.writeFileSync(filePath, JSON.stringify(updatedAds, null, 2));

  console.log(`Game "${gameKey}" added successfully to all ads.`);
};

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Please provide both a key and value.");
  process.exit(1);
}

const [newGameKey, newGameUrl, jsonPath] = args;

const filePath = path.join(__dirname, jsonPath);

updateAdsWithNewGame(filePath, newGameKey, newGameUrl);
