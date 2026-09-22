import { useUser } from '../auth/hooks/useUser';
import useGetHoldings from './hooks/useGetHoldings';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const StockTable = () => {
  const { data: user } = useUser();
  const { data: data, isLoading, isError } = useGetHoldings(user ?? null);

  if (isLoading) {
    return <div className="p-6 text-center text-slate-400">Loading holdings & live prices...</div>;
  }

  if (isError) {
    return <div className="p-6 text-center text-rose-400">Failed to load holdings.</div>;
  }

  const holdings = data?.holdings ?? [];
  if (!holdings || holdings.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">No holdings found for this portfolio.</div>
    );
  }

  return (
    <div className="mx-2 mb-8 overflow-x-auto rounded-lg border border-slate-800 bg-black">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
          <tr>
            <th className="p-3 text-left">Ticker</th>
            <th className="p-3 text-right">Shares</th>
            <th className="p-3 text-right">Avg Buy Price</th>
            <th className="p-3 text-right">Current Price</th>
            <th className="p-3 text-right">Market Value</th>
            <th className="p-3 text-right">Unrealized P&L</th>
            <th className="p-3 text-right">Weight</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, index) => {
            const isPositive = h.unrealized_pnl >= 0;
            const pnlColorClass = isPositive ? 'text-emerald-400' : 'text-rose-400';

            return (
              <tr
                key={`${h.ticker}-${index}`}
                className="border-b border-slate-900 transition-colors hover:bg-slate-900/50 dark:odd:bg-slate-950/50 dark:even:bg-black"
              >
                <td className="p-3 font-semibold text-slate-100">{h.ticker}</td>
                <td className="p-3 text-right font-mono text-slate-300">
                  {h.shares.toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono text-slate-300">
                  {currencyFormatter.format(h.avg_price_per_share)}
                </td>
                <td className="p-3 text-right font-mono text-slate-300">
                  {currencyFormatter.format(h.current_price)}
                </td>
                <td className="p-3 text-right font-mono font-medium text-slate-100">
                  {currencyFormatter.format(h.current_value)}
                </td>
                <td className={`p-3 text-right font-mono font-medium ${pnlColorClass}`}>
                  {isPositive ? '+' : ''}
                  {currencyFormatter.format(h.unrealized_pnl)} ({isPositive ? '+' : ''}
                  {percentFormatter.format(h.unrealized_pnl_pct / 100)})
                </td>
                <td className="p-3 text-right font-mono text-slate-400">
                  {percentFormatter.format(h.weight)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;
