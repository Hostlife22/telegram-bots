export const convertToNumber = (str: string): number => {
  const num = parseInt(str);
  return isNaN(num) ? 0 : num;
};

export const parseStringToNumber = (input: string): number => {
  const match = input.match(/-?\d+(\.\d+)?/);
  if (match) {
    return parseFloat(match[0]);
  }
 return 0;
};
