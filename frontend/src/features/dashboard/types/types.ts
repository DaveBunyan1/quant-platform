export interface PortfolioPosition {
  ticker: string;
  shares: number;
  cost_basis: number;
  avg_price_per_share: number;
  current_price: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  weight: number;
}

export interface PortfolioSummaryResponse {
  holdings: PortfolioPosition[];
}

export interface CreateTransactionPayload {
  ticker: string;
  shares: number;
  price_per_share: number;
  transaction_at: string;
}
