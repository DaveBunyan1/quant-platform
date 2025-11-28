import convertToSeconds from "./convertToSeconds";

const constructDownloadUrl = (
  ticker: string,
  period1: string,
  period2: string,
  interval: "daily" | "weekly" | "monthly" = "daily"
) => {
  const interval_reference: Record<typeof interval, string> = {
    daily: "1d",
    weekly: "1wk",
    monthly: "1mo",
  };
  const _interval = interval_reference[interval];

  const start = convertToSeconds(period1);
  const end = convertToSeconds(period2);

  const url = `https://query1.finance.yahoo.com/v7/finance/download/${ticker}?period1=${start}&period2=${end}&interval=${_interval}&events=history&includeAdjustedClose=true`;

  return url;
};
export default constructDownloadUrl;
