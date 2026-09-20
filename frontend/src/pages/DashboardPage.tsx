import LogoutButton from '@/features/auth/components/LogoutButton';
import AddHolding from '@/features/dashboard/AddHolding';
import StockTable from '@/features/dashboard/StockTable';

const DashboardPage = () => {
  return (
    <>
      <nav>
        <AddHolding />
        <StockTable />
        <button>Home</button>
        <button>Optimize</button>
        <button>Account</button>
      </nav>
      <h1>Portfolio Overview</h1>
      <div>
        <div>Current Value: $110,456</div>
        <div>Unrealised P/L: $10,456</div>
        <div>Return: 10.46%</div>
        <div>Cost Basis: $100,000</div>
        <div>Sharpe Ratio: 1.42</div>
        <div>Volatility: 12.4%</div>
      </div>
      <div>Graph</div>
      <div>Analysis (Sharpe, volatility, CAGR, Max DD, Beta, Alpha, Fama French)</div>
      <div>Allocation</div>
      <div>Recent Activity</div>
      <div>Suggestions</div>
      <LogoutButton />
    </>
  );
};

export default DashboardPage;
