import { writeFileSync } from "fs";
import { logger } from "./Logger";

class PixelDifferenceStore {
  private _differences: { [key: string]: string } = {};

  constructor(initialDifferences?: { [key: string]: string }) {
    if (initialDifferences) {
      this._differences = { ...initialDifferences };
    }
  }

  get differences(): { [key: string]: string } {
    return this._differences;
  }

  set differences(newDifferences: { [key: string]: string }) {
    this._differences = { ...newDifferences };
  }

  addDifference(coordinateKey: string, color: string) {
    this._differences[coordinateKey] = color;
  }

  removeDifference(coordinateKey: string) {
    if (this._differences[coordinateKey]) {
      delete this._differences[coordinateKey];
    }
  }

  async loadFromFile(filePath: string) {
    try {
      const data = await import(filePath);
      this.differences = (data.pixelDifferences as { [key: string]: string }) || {};
    } catch (error) {
      logger.error(`Error loading pixel differences from file: ${error}`);
    }
  }

  async saveToFile(filePath: string) {
    const outputData = `export const pixelDifferences = ${JSON.stringify(this.differences, null, 2)};\n`;
    writeFileSync(filePath, outputData, "utf-8");
  }
}

export const pixelStore = new PixelDifferenceStore();
