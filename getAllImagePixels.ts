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

// левый верхний угол у координат в пикселях
const IMAGE_CONFIG: ImageItemConfig[] = [
  { imageName: "island", initialCoordinate: { x: 0, y: 372 } },
  { imageName: "worldtemplate", initialCoordinate: { x: 372, y: 372 } },
  { imageName: "pacman", initialCoordinate: { x: 744, y: 372 } },
];

async function getAllImagePixels(imagePath: string) {
  try {
    const { data, info } = await sharp(imagePath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });

    const pixelArray = new Uint8Array(data);
    const { width, height } = info;

    const pixelMatrix: string[][] = [];
    for (let y = 0; y < height; y++) {
      const row: string[] = [];
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = pixelArray[index]; // Красный
        const g = pixelArray[index + 1]; // Зеленый
        const b = pixelArray[index + 2]; // Синий

        const rgbColor = `rgb(${r}, ${g}, ${b})`;
        row.push(rgbColor);
      }
      pixelMatrix.push(row);
    }

    return {
      pixelMatrix,
      width,
      height,
    };
  } catch (error) {
    console.error(`Ошибка при получении пикселей: ${error}`);
    throw error;
  }
}

async function writePixelMatrixToFile(image: ImageItemConfig, imagePath: string, outputFilePath: string) {
  try {
    const { pixelMatrix, width, height } = await getAllImagePixels(imagePath);
    const dataName = `${image.imageName}Data`;

    const outputData = `export const ${dataName} = {\n  width: ${width},\n  height: ${height},\n  initialCoordinate: ${JSON.stringify(image.initialCoordinate, null, 2)},\n  pixelMatrix: ${JSON.stringify(pixelMatrix, null, 2)}\n};\n`;

    fs.writeFileSync(outputFilePath, outputData, "utf-8");
    logger.info(`Матрица пикселей успешно записана в файл: ${outputFilePath}`);
  } catch (err) {
    logger.error(`Ошибка при записи в файл ${outputFilePath}: ${err}`);
  }
}

for (const image of IMAGE_CONFIG) {
  const imagePath = path.join(__dirname, "assets", `${image.imageName}.png`);
  const outputFilePath = path.join(__dirname, "assets", "data", `${image.imageName}.ts`);
  writePixelMatrixToFile(image, imagePath, outputFilePath).catch((err) => {
    logger.error(`Ошибка: ${err}`);
  });
}
