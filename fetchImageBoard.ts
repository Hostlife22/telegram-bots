import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";

import { logger } from "./core/Logger";

const outputFilePath = path.join(__dirname, "assets", "data", "board", "board.bin");
const outputDifFilePath = path.join(__dirname, "assets", "data", "pixelDifferences.ts");

interface ImageItemConfig {
  imageName: string;
  initialCoordinate: {
    x: number;
    y: number;
  };
}

const IMAGE_CONFIG: ImageItemConfig[] = [
  { imageName: "island", initialCoordinate: { x: 0, y: 372 } },
  { imageName: "worldtemplate", initialCoordinate: { x: 372, y: 372 } },
  { imageName: "pacman", initialCoordinate: { x: 744, y: 372 } },
];

const MAIN_IMAGE_SIZE = 1000;
const STENCIL_SIZE = 256;
const MAX_ERRORS = 10;

let errorCount = 0;

async function readBinaryFile(filePath: string): Promise<Uint8Array> {
  const pixelData = readFileSync(filePath);
  return new Uint8Array(pixelData);
}

function rgbToString(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

async function compareImages(mainPixels: Uint8Array, imageConfigs: ImageItemConfig[]): Promise<{ [key: string]: string }> {
  const differences: { [key: string]: string } = {};

  for (const image of imageConfigs) {
    const stencilPath = path.join(__dirname, "assets", "data", `${image.imageName}.bin`);
    const stencilPixels = await readBinaryFile(stencilPath);

    const { x: startX, y: startY } = image.initialCoordinate;

    for (let y = 0; y < STENCIL_SIZE; y++) {
      for (let x = 0; x < STENCIL_SIZE; x++) {
        const mainIndex = ((startY + y) * MAIN_IMAGE_SIZE + (startX + x)) * 4;
        const stencilIndex = (y * STENCIL_SIZE + x) * 4;

        const rMain = mainPixels[mainIndex];
        const gMain = mainPixels[mainIndex + 1];
        const bMain = mainPixels[mainIndex + 2];

        const rStencil = stencilPixels[stencilIndex];
        const gStencil = stencilPixels[stencilIndex + 1];
        const bStencil = stencilPixels[stencilIndex + 2];

        if (rMain !== rStencil || gMain !== gStencil || bMain !== bStencil) {
          const coordinateKey = `${startX + x},${startY + y}`;
          differences[coordinateKey] = rgbToString(rStencil, gStencil, bStencil);
        }
      }
    }
  }

  return differences;
}

async function saveDifferencesToFile(differences: { [key: string]: string }, outputFilePath: string) {
  const outputData = `export const pixelDifferences = ${JSON.stringify(differences, null, 2)};\n`;
  writeFileSync(outputFilePath, outputData, "utf-8");
}

async function fetchImageData(): Promise<{ width: number; height: number; canvasMatrix: Uint8Array } | undefined> {
  try {
    const response = await axios.get("https://image.notpx.app/api/v2/image", {
      responseType: "arraybuffer",
    });

    const image = sharp(response.data);
    const { width, height } = await image.metadata();

    if (!width || !height) {
      throw new Error("Invalid image dimensions");
    }

    const { data: pixelData } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    const canvasMatrix = new Uint8Array(pixelData);

    writeFileSync(outputFilePath, canvasMatrix);

    return { width, height, canvasMatrix };
  } catch (error) {
    errorCount++;
    logger.error(`Error fetching or processing image: ${error}`);
    return undefined;
  }
}

async function processImages() {
  const canvasData = await fetchImageData();
  if (!canvasData) return;

  const differences = await compareImages(canvasData.canvasMatrix, IMAGE_CONFIG);
  logger.info(`Differences count: ${Object.keys(differences).length} pixels`);
  await saveDifferencesToFile(differences, outputDifFilePath);
}

const intervalId = setInterval(async () => {
  await processImages();

  if (errorCount >= MAX_ERRORS) {
    clearInterval(intervalId);
    logger.error(`Max error limit reached. Stopping image fetching.`);
  }
}, 7000);
