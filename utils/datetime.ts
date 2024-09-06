import { getRandomNumberBetween } from "./delay";

export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function generateRandomCron(fromMinutes: number, toMinutes: number): string {
  const randomMinutes = Math.floor(Math.random() * (toMinutes - fromMinutes + 1)) + fromMinutes;

  return `*/${randomMinutes} * * * *`;
}

export function generateExecutionTime(format: "datetime" | "localString" | "timestamp" = "datetime"): string | number | Date {
  const HOUR_IN_MS = 60 * 60 * 1000;
  const minDelay = 8 * HOUR_IN_MS;
  const maxDelay = 9 * HOUR_IN_MS;
  const randomDelay = getRandomNumberBetween(minDelay, maxDelay);
  const nextExecutionTime = new Date(Date.now() + randomDelay);

  const formatToValue = {
    datetime: nextExecutionTime,
    localString: nextExecutionTime.toString(),
    timestamp: nextExecutionTime.getTime(),
  };

  return formatToValue[format];
}

export function currentTime(format: string = "string"): string | number {
  let tzOffset = new Date().getTimezoneOffset() * 60000;

  if (format === "json") {
    return new Date(Date.now() - tzOffset).toISOString();
  }

  if (format === "timestamp") {
    return new Date(Date.now() - tzOffset).getTime();
  }

  return new Date(Date.now() - tzOffset).toISOString().slice(0, -5).replace("T", " ");
}
