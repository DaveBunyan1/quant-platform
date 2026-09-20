export type HoldingBase = {
  id: string;
  user_id: string;
  ticker: string;
  shares: number;
  price_per_share: number;
  transaction_at: Date;
  created_at: Date;
};

export type HoldingDetail = {
  ticker: string;
  shares: number;
  price: number;
  buy_price: number;
  value: number;
  cost_basis: number; // shares * buy_price
  pnl: number;
  pnl_pct: number;
  weight: number;
};

export type HoldingsResponse = {
  holdings: HoldingBase[];
};

export interface CreateTransactionPayload {
  ticker: string;
  shares: number;
  price_per_share: number;
  transaction_at: string;
}
