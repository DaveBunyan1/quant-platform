import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useUser } from '@/features/auth/hooks/useUser';
import useGetHoldings from '@/features/dashboard/hooks/useGetHoldings';
import StockTable from '@/features/dashboard/components/StockTable';

// Mock hooks
vi.mock('@/features/auth/hooks/useUser', () => ({
  useUser: vi.fn(),
}));

vi.mock('@/features/dashboard/hooks/useGetHoldings', () => ({
  default: vi.fn(),
}));

describe('StockTable', () => {
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Jane Doe',
  };

  const mockHoldingsData = {
    totalValue: 25000,
    totalGainLoss: 3200,
    holdings: [
      {
        ticker: 'AAPL',
        shares: 10,
        avg_price_per_share: 150,
        current_price: 175,
        current_value: 1750,
        unrealized_pnl: 250,
        unrealized_pnl_pct: 16.67,
        weight: 0.07,
      },
      {
        ticker: 'MSFT',
        shares: 5,
        avg_price_per_share: 400,
        current_price: 380,
        current_value: 1900,
        unrealized_pnl: -100,
        unrealized_pnl_pct: -5,
        weight: 0.076,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useUser).mockReturnValue({
      data: mockUser,
    } as any);

    vi.mocked(useGetHoldings).mockReturnValue({
      data: mockHoldingsData,
      isLoading: false,
      isError: false,
    } as any);
  });

  it('renders the loading state', () => {
    vi.mocked(useGetHoldings).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);

    render(<StockTable />);

    expect(screen.getByText('Loading holdings & live prices...')).toBeInTheDocument();
  });

  it('renders the error state', () => {
    vi.mocked(useGetHoldings).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);

    render(<StockTable />);

    expect(screen.getByText('Failed to load holdings.')).toBeInTheDocument();
  });

  it('renders the empty state when there are no holdings', () => {
    vi.mocked(useGetHoldings).mockReturnValue({
      data: {
        ...mockHoldingsData,
        holdings: [],
      },
      isLoading: false,
      isError: false,
    } as any);

    render(<StockTable />);

    expect(screen.getByText('No holdings found for this portfolio.')).toBeInTheDocument();
  });

  it('renders all table headers', () => {
    render(<StockTable />);

    expect(screen.getByRole('columnheader', { name: 'Ticker' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Shares' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Avg Buy Price' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Current Price' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Market Value' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Unrealized P&L' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Weight' })).toBeInTheDocument();
  });

  it('renders holding data correctly', () => {
    render(<StockTable />);

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('$400.00')).toBeInTheDocument();

    expect(screen.getByText('$175.00')).toBeInTheDocument();
    expect(screen.getByText('$380.00')).toBeInTheDocument();

    expect(screen.getByText('$1,750.00')).toBeInTheDocument();
    expect(screen.getByText('$1,900.00')).toBeInTheDocument();
  });

  it('formats positive unrealized P&L with a plus sign', () => {
    render(<StockTable />);

    expect(screen.getByText('+$250.00 (+16.67%)')).toBeInTheDocument();
  });

  it('formats negative unrealized P&L without a plus sign', () => {
    render(<StockTable />);

    expect(screen.getByText('-$100.00 (-5.00%)')).toBeInTheDocument();
  });

  it('formats portfolio weight as a percentage', () => {
    render(<StockTable />);

    expect(screen.getByText('7.00%')).toBeInTheDocument();
    expect(screen.getByText('7.60%')).toBeInTheDocument();
  });

  it('passes the user to useGetHoldings', () => {
    render(<StockTable />);

    expect(useGetHoldings).toHaveBeenCalledWith(mockUser);
  });

  it('passes null to useGetHoldings when there is no authenticated user', () => {
    vi.mocked(useUser).mockReturnValue({
      data: undefined,
    } as any);

    render(<StockTable />);

    expect(useGetHoldings).toHaveBeenCalledWith(null);
  });
});
