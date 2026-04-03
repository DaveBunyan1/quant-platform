import numpy as np
import pandas as pd

def sharpe_ratio(returns: pd.Series) -> float:
    return np.sqrt(252) * returns.mean() / returns.std()

def cumulative_return(returns: pd.Series) -> float:
    return (1 + returns).prod() - 1 # type: ignore