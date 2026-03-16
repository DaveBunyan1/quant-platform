import numpy as np

def sharpe_ratio(returns):
    return np.sqrt(252) * returns.mean() / returns.std()

def cumulative_return(returns):
    return (1 + returns).prod() - 1