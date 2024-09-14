import { logger } from "../core/Logger";
import { delay } from "./delay";

export const retry = async <T>(fn: () => Promise<T>, tag?: string, retries = 3, delayMs = 2000): Promise<T> => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      attempt++;
      if (attempt < retries) {
        await delay(delayMs);
      } else {
        throw error;
      }
    }
  }
};
