import { existedCoordinates } from "./existedCoordinates";

export interface Pixel {
  x: number;
  y: number;
  color: string;
}

function groupByColorAndZones(pixelDifferences: { [key: string]: string }): { [color: string]: Pixel[] } {
  const parsedPixels: Pixel[] = [];

  for (const [key, color] of Object.entries(pixelDifferences)) {
    const [x, y] = key.split(",").map(Number);
    parsedPixels.push({ x, y, color });
  }

  const groupedByColor: { [color: string]: Pixel[] } = parsedPixels
    .filter((item) => item.color !== "rgb(0, 0, 0)")
    .reduce(
      (groups, pixel) => {
        const { color } = pixel;
        if (!groups[color]) {
          groups[color] = [];
        }
        groups[color].push(pixel);
        return groups;
      },
      {} as { [color: string]: Pixel[] },
    );

  return groupedByColor;
}

function removeDuplicatePixels(pixels: Pixel[]): Pixel[] {
  const uniquePixels: { [key: string]: Pixel } = {};

  pixels.forEach((pixel) => {
    const coordinateKey = `${pixel.x},${pixel.y}`;
    if (!uniquePixels[coordinateKey]) {
      uniquePixels[coordinateKey] = pixel;
    }
  });

  return Object.values(uniquePixels);
}

function filterByDivisibleCoordinates(pixels: Pixel[]): Pixel[] {
  return pixels
    .filter((pixel) => existedCoordinates.find((coord) => coord.canvas.x === pixel.x))
    .filter((pixel) => existedCoordinates.find((coord) => coord.canvas.y === pixel.y));
}

export function pixelDiffToPixelClickMap(pixelDifferences: { [key: string]: string }): Pixel[] {
  const groupedByColor = groupByColorAndZones(pixelDifferences);
  const selectedPoints: Pixel[] = [];

  for (const [color, pixels] of Object.entries(groupedByColor)) {
    const filteredPixels = filterByDivisibleCoordinates(pixels);
    const uniqueFilteredPixels = removeDuplicatePixels(filteredPixels);
    selectedPoints.push(...uniqueFilteredPixels);
  }

  return removeDuplicatePixels(selectedPoints);
}
