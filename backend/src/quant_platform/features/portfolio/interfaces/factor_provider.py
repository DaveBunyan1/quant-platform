from datetime import date
from typing import Protocol

import pandas as pd


class FactorDataProviderProtocol(Protocol):
    async def get_fama_french_3(
        self,
        start_date: date,
        end_date: date | None = None,
    ) -> pd.DataFrame: ...

    async def get_fama_french_5(
        self,
        start_date: date,
        end_date: date | None = None,
    ) -> pd.DataFrame: ...
