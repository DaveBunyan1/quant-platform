import { useState } from 'react';
import { useAddHolding } from './hooks/useAddHolding';

const AddHolding = () => {
  const [ticker, setTicker] = useState<string>('');
  const [shares, setShares] = useState<string>('');
  const [buyPrice, setBuyPrice] = useState<string>('');

  const { mutate: addHolding, isPending, isError, error } = useAddHolding();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedShares = parseFloat(shares);
    const parsedPrice = parseFloat(buyPrice);

    if (!ticker.trim() || isNaN(parsedShares) || isNaN(parsedPrice)) {
      return;
    }

    addHolding(
      {
        ticker: ticker.toUpperCase().trim(),
        shares: parsedShares,
        price_per_share: parsedPrice,
        transaction_at: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          // Reset form fields
          setTicker('');
          setShares('');
          setBuyPrice('');
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="m-2 mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-slate-800 bg-black p-4"
    >
      {/* Ticker */}
      <div className="flex flex-col">
        <label className="mb-1 text-xs font-medium text-slate-400">Ticker</label>
        <input
          required
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="w-28 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 uppercase placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          placeholder="AAPL"
        />
      </div>

      {/* Shares */}
      <div className="flex flex-col">
        <label className="mb-1 text-xs font-medium text-slate-400">Shares</label>
        <input
          required
          type="number"
          step="any"
          min="0.000001"
          placeholder="0.00"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          className="w-28 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Buy Price */}
      <div className="flex flex-col">
        <label className="mb-1 text-xs font-medium text-slate-400">Buy Price ($)</label>
        <input
          required
          type="number"
          step="any"
          min="0.01"
          placeholder="0.00"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          className="w-28 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Adding...' : 'Add Holding'}
      </button>

      {/* Error message */}
      {isError && (
        <div className="w-full text-xs text-rose-400">
          Failed to add holding: {error?.message || 'Check your inputs.'}
        </div>
      )}
    </form>
  );
};

export default AddHolding;
