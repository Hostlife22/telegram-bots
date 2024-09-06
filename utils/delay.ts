function delay(time: number): Promise<unknown> {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

async function randomDelay(minDelay: number, maxDelay: number, timeFormat: string = "ms"): Promise<void> {
  let maxDelayOrigin = maxDelay;
  let minDelayOrigin = minDelay;
  if (timeFormat === "s") {
    maxDelayOrigin *= 1000;
    minDelayOrigin *= 1000;
  }
  const randomDelay = Math.random() * (maxDelayOrigin - minDelayOrigin) + minDelayOrigin;
  const nmb = Math.floor(randomDelay);
  await delay(nmb);
}

function getRandomNumberBetween(minDelay: number, maxDelay: number): number {
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
}

export { delay, randomDelay, getRandomNumberBetween };
