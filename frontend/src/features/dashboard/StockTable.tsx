import { useUser } from '../auth/hooks/useUser';
import useGetHoldings from './hooks/useGetHoldings';

const StockTable = () => {
  const { data: user } = useUser();
  const { data, isLoading, isError } = useGetHoldings(user ?? null);

  if (isLoading) {
    return <div className="p-4 text-center">Loading holdings...</div>;
  }

  if (isError) {
    return <div className="p-4 text-center text-rose-400">Failed to load holdings.</div>;
  }

  return (
    <div className="m-2 mb-8 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 text-gray-200 dark:bg-black">
          <tr>
            <th className="p-3 text-left">Ticker</th>
            <th className="p-3 text-right">Shares</th>
            <th className="p-3 text-right">Buy Price</th>
            {/* <th className="p-3 text-right">Current</th> */}
            {/* <th className="p-3 text-right">Value</th> */}
            {/* <th className="p-3 text-right">P&L</th> */}
            {/* <th className="p-3 text-right">Weight</th> */}
          </tr>
        </thead>
        <tbody>
          {data?.holdings?.map((h, index) => (
            <tr
              key={`${h.ticker}-${index}`}
              className="border-b border-slate-800 dark:odd:bg-gray-950 dark:even:bg-black"
            >
              <td className="p-3 font-medium">{h.ticker}</td>
              <td className="p-3 text-right">{h.shares}</td>
              <td className="p-3 text-right">${h.price_per_share.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;
