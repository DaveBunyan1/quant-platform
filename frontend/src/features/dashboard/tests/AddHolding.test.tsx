import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as useAddHoldingModule from '@/features/dashboard/hooks/useAddHolding';
import AddHolding from '@/features/dashboard/components/AddHolding';

// Mock the module explicitly using a spy on the named export
vi.mock('@/features/dashboard/hooks/useAddHolding', () => ({
  useAddHolding: vi.fn(),
}));

describe('AddHolding Component', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAddHoldingModule.useAddHolding).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);
  });

  it('renders all inputs and the submit button correctly', () => {
    render(<AddHolding />);

    expect(screen.getByLabelText(/ticker/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/shares/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/buy price/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add holding/i })).toBeInTheDocument();
  });

  it('submits parsed form data and resets fields on success', async () => {
    const user = userEvent.setup();

    mockMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.();
    });

    render(<AddHolding />);

    const tickerInput = screen.getByLabelText(/ticker/i);
    const sharesInput = screen.getByLabelText(/shares/i);
    const priceInput = screen.getByLabelText(/buy price/i);
    const submitButton = screen.getByRole('button', { name: /add holding/i });

    await user.type(tickerInput, 'aapl');
    await user.type(sharesInput, '10.5');
    await user.type(priceInput, '150.25');

    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      {
        ticker: 'AAPL',
        shares: 10.5,
        price_per_share: 150.25,
        transaction_at: expect.any(String),
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );

    expect(tickerInput).toHaveValue('');
    expect(sharesInput).toHaveValue(null);
    expect(priceInput).toHaveValue(null);
  });

  it('prevents submission when fields fail validation', async () => {
    const user = userEvent.setup();
    render(<AddHolding />);

    const submitButton = screen.getByRole('button', { name: /add holding/i });

    await user.click(submitButton);

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('disables submit button and shows loading state when mutation is pending', () => {
    vi.mocked(useAddHoldingModule.useAddHolding).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(<AddHolding />);

    const submitButton = screen.getByRole('button', { name: /adding\.\.\./i });

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Adding...');
  });

  it('displays an error message when mutation fails', () => {
    vi.mocked(useAddHoldingModule.useAddHolding).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('Invalid symbol provided'),
    } as any);

    render(<AddHolding />);

    expect(screen.getByText(/failed to add holding: invalid symbol provided/i)).toBeInTheDocument();
  });
});
