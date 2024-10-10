import sharp from "sharp";
import path from "path";
import fs from "fs";

import { logger } from "./core/Logger";

interface ImageItemConfig {
  imageName: string;
  initialCoordinate: {
    x: number;
    y: number;
  };
}

const IMAGE_CONFIG: ImageItemConfig[] = [
  // { imageName: "island", initialCoordinate: { x: 0, y: 372 } },
  // { imageName: "worldtemplate", initialCoordinate: { x: 372, y: 372 } },
  // { imageName: "pacman", initialCoordinate: { x: 744, y: 372 } },
  { imageName: "durov", initialCoordinate: { x: 244, y: 244 } },
];

async function getAllImagePixels(imagePath: string) {
  try {
    const { data, info } = await sharp(imagePath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });

    const pixelArray = new Uint8Array(data);
    const { width, height } = info;

    return {
      pixelArray,
      width,
      height,
    };
  } catch (error) {
    logger.error(`Error getting image pixels: ${error}`);
    throw error;
  }
}

async function writePixelMatrixToFile(imagePath: string, outputFilePath: string) {
  try {
    const { pixelArray, width, height } = await getAllImagePixels(imagePath);

    fs.writeFileSync(outputFilePath, pixelArray);
    logger.info(`Pixel matrix saved to: ${outputFilePath}`);
  } catch (err) {
    logger.error(`Error writing pixel matrix to file: ${outputFilePath}: ${err}`);
  }
}

for (const image of IMAGE_CONFIG) {
  const imagePath = path.join(__dirname, "assets", `${image.imageName}.png`);
  const outputFilePath = path.join(__dirname, "assets", "data", `${image.imageName}.bin`);
  writePixelMatrixToFile(imagePath, outputFilePath).catch((err) => {
    logger.error(`Error writing pixel matrix to file: ${err}`);
  });
}
