import { logger } from "../core/Logger";
import { ShuffleArrayType } from "../types";

export const shuffleArray = <T>(array: T[], type: ShuffleArrayType = "asc", initPosition: number = 0): T[] => {
  if (initPosition >= array.length) {
    logger.warning(`InitPosition ${initPosition} is greater than array length ${array.length}`);
    return [];
  }

  const slicedArray = array.slice(initPosition);

  if (type === "asc") return slicedArray;
  if (type === "desc") return slicedArray.reverse();
  if (type === "shuffle") {
    for (let i = slicedArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slicedArray[i], slicedArray[j]] = [slicedArray[j], slicedArray[i]];
    }
  }

  return slicedArray;
};
