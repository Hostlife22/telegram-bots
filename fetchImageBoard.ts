import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import WebSocket from "ws";

import { logger } from "./core/Logger";
import { pixelStore } from "./core/PixelDifferenceStore";

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
  // { imageName: "island", initialCoordinate: { x: 0, y: 372 } },
  // { imageName: "worldtemplate", initialCoordinate: { x: 372, y: 372 } },
  { imageName: "durov", initialCoordinate: { x: 244, y: 244 } },
  // { imageName: "pacman", initialCoordinate: { x: 744, y: 372 } },
];

const MAIN_IMAGE_SIZE = 1000;
const STENCIL_SIZE = 512;

let websocketFailureCount = 0;
let processImagesErrorCount = 0;
const maxWebSocketFailures = 20;
const maxProcessImagesErrors = 10;

let processImagesInterval: NodeJS.Timeout | null = null;
let isFetching = false;

async function readBinaryFile(filePath: string): Promise<Uint8Array> {
  const pixelData = readFileSync(filePath);
  return new Uint8Array(pixelData);
}

function rgbToString(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

async function compareImages(mainPixels: Uint8Array, imageConfigs: ImageItemConfig[]) {
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
          pixelStore.addDifference(coordinateKey, rgbToString(rStencil, gStencil, bStencil));
        }
      }
    }
  }
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
    logger.error(`Error fetching or processing image: ${error}`);
    return undefined;
  }
}

export async function processImages() {
  const canvasData = await fetchImageData();
  if (!canvasData) {
    processImagesErrorCount++;
    if (processImagesErrorCount >= maxProcessImagesErrors) {
      logger.error("Too many errors in processImages. Stopping calls to processImages.");
      if (processImagesInterval) {
        clearInterval(processImagesInterval);
        processImagesInterval = null;
      }
      return;
    }
    return;
  }

  processImagesErrorCount = 0;

  await compareImages(canvasData.canvasMatrix, IMAGE_CONFIG);
  await pixelStore.saveToFile(outputDifFilePath);
}

function connectWebSocket() {
  const socket = new WebSocket("wss://notpx.app/api/v2/image/ws");

  socket.on("open", () => {
    logger.info("WebSocket connection established");
    websocketFailureCount = 0;
    pixelStore.differences = {};
    socket.send(JSON.stringify({ action: "subscribe", channel: "imageUpdates" }));
  });

  socket.on("message", (data) => {
    try {
      const updates = data.toString().split("\n");
      const updatedPixels: { [key: string]: string } = {};

      for (const update of updates) {
        const match = update.match(/pixelUpdate:(\d+):#([0-9A-Fa-f]{6})/);
        if (match) {
          const pixelIndex = match[1];
          const color = `#${match[2]}`;
          updatedPixels[pixelIndex] = color;
        }
      }

      compareWebSocketUpdates(updatedPixels);
    } catch (error) {
      logger.error(`Error processing WebSocket message: ${error}`);
    }
  });

  socket.on("error", (event) => {
    logger.error(`Ошибка WebSocket: ${event}`);
    websocketFailureCount++;
    if (websocketFailureCount >= maxWebSocketFailures) {
      logger.error("Too many WebSocket connection failures. Stopping connection attempts.");
      if (processImagesInterval) {
        clearInterval(processImagesInterval);
        processImagesInterval = null;
      }
      return;
    }
    setTimeout(connectWebSocket, 5000);
  });

  socket.on("close", (event) => {
    logger.info(`WebSocket connection closed: ${event}`);
    websocketFailureCount++;
    if (websocketFailureCount < maxWebSocketFailures) {
      setTimeout(connectWebSocket, 5000);
    } else {
      logger.error("Too many WebSocket connection failures. Stopping connection attempts.");
      if (processImagesInterval) {
        clearInterval(processImagesInterval);
        processImagesInterval = null;
      }
    }
  });
}

async function compareWebSocketUpdates(updatedPixels: { [key: string]: string }) {
  try {
    const stencilPath = path.join(__dirname, "assets", "data", `${IMAGE_CONFIG[0].imageName}.bin`);
    const stencilPixels = await readBinaryFile(stencilPath);
    const { x: startX, y: startY } = IMAGE_CONFIG[0].initialCoordinate;

    for (const [pixelIndexStr, newColor] of Object.entries(updatedPixels)) {
      const pixelIndex = parseInt(pixelIndexStr);
      const pixelIndexAdjusted = pixelIndex - 1;
      const x = pixelIndexAdjusted % MAIN_IMAGE_SIZE;
      const y = Math.floor(pixelIndexAdjusted / MAIN_IMAGE_SIZE);

      if (x < startX || x >= startX + STENCIL_SIZE || y < startY || y >= startY + STENCIL_SIZE) {
        continue;
      }

      const coordinateKey = `${x},${y}`;

      const bigint = parseInt(newColor.slice(1), 16);
      const rNew = (bigint >> 16) & 255;
      const gNew = (bigint >> 8) & 255;
      const bNew = bigint & 255;

      const stencilIndex = (y - startY) * STENCIL_SIZE * 4 + (x - startX) * 4;

      const rStencil = stencilPixels[stencilIndex];
      const gStencil = stencilPixels[stencilIndex + 1];
      const bStencil = stencilPixels[stencilIndex + 2];

      if (rNew === rStencil && gNew === gStencil && bNew === bStencil) {
        pixelStore.removeDifference(coordinateKey);
      } else {
        pixelStore.addDifference(coordinateKey, rgbToString(rStencil, gStencil, bStencil));
      }
    }
  } catch (error) {
    logger.error(`Error processing WebSocket updates: ${error}`);
  }
}

export function startFetchImageBoard() {
  if (isFetching) {
    logger.warning("Fetching is already in progress.");
    return;
  }
  isFetching = true;
  processImages().then(() => {
    connectWebSocket();
  });

  processImagesInterval = setInterval(() => {
    if (websocketFailureCount > maxWebSocketFailures) {
      logger.info("Fetching images...");
      processImages();
    }
  }, 7000);
}

export function stopFetchImageBoard() {
  if (!isFetching) {
    logger.warning("Fetching is not currently running.");
    return;
  }
  isFetching = false;

  if (processImagesInterval) {
    clearInterval(processImagesInterval);
    processImagesInterval = null;
  }
}
