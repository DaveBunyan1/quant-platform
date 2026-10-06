from dataclasses import dataclass

import pandas as pd
import statsmodels.api as sm  # type: ignore


@dataclass(frozen=True)
class FactorModelResult:
    alpha: float
    betas: dict[str, float]
    r_squared: float


def calculate_factor_model(
    portfolio_returns: pd.Series,
    factors: pd.DataFrame,
    factor_columns: list[str],
) -> FactorModelResult:
    data = pd.concat(
        [
            portfolio_returns.rename("portfolio"),
            factors,
        ],
        axis=1,
        join="inner",
    ).dropna()

    if data.empty:
        raise ValueError("No overlapping observations")

    excess_returns = data["portfolio"] - data["RF"]

    X = sm.add_constant(
        data[factor_columns],
    )

    model = sm.OLS(
        excess_returns,
        X,
    ).fit()

    return FactorModelResult(
        alpha=float(model.params["const"]),
        betas={factor: float(model.params[factor]) for factor in factor_columns},
        r_squared=float(model.rsquared),
    )


def calculate_fama_french_3(
    portfolio_returns: pd.Series,
    factors: pd.DataFrame,
) -> FactorModelResult:
    return calculate_factor_model(
        portfolio_returns,
        factors,
        ["Mkt-RF", "SMB", "HML"],
    )


def calculate_fama_french_5(
    portfolio_returns: pd.Series,
    factors: pd.DataFrame,
) -> FactorModelResult:
    return calculate_factor_model(
        portfolio_returns,
        factors,
        ["Mkt-RF", "SMB", "HML", "RMW", "CMA"],
    )
