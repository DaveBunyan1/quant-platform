const convertToSeconds = (period: string): number => {
  const date = new Date(period);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${period}`);
  }

  return Math.floor(date.getTime() / 1000);
};

export default convertToSeconds;
