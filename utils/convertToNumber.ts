export const convertToNumber = (str: string): number => {
  const num = parseInt(str);
  return isNaN(num) ? 0 : num;
};
