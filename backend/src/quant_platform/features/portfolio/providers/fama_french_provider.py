import asyncio
import io
import zipfile
from datetime import date

import pandas as pd
import requests


class FamaFrenchDataProvider:
    FF3_URL = (
        "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/"
        "ftp/F-F_Research_Data_Factors_daily_CSV.zip"
    )

    FF5_URL = (
        "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/"
        "ftp/F-F_Research_Data_5_Factors_2x3_daily_CSV.zip"
    )

    async def get_fama_french_3(
        self,
        start_date: date,
        end_date: date | None = None,
    ) -> pd.DataFrame:
        return await self._fetch(
            self.FF3_URL,
            start_date,
            end_date,
            factor_columns=["Mkt-RF", "SMB", "HML", "RF"],
        )

    async def get_fama_french_5(
        self,
        start_date: date,
        end_date: date | None = None,
    ) -> pd.DataFrame:
        return await self._fetch(
            self.FF5_URL,
            start_date,
            end_date,
            factor_columns=[
                "Mkt-RF",
                "SMB",
                "HML",
                "RMW",
                "CMA",
                "RF",
            ],
        )

    async def _fetch(
        self,
        url: str,
        start_date: date,
        end_date: date | None,
        factor_columns: list[str],
    ) -> pd.DataFrame:
        loop = asyncio.get_running_loop()

        return await loop.run_in_executor(
            None,
            self._fetch_sync,
            url,
            start_date,
            end_date,
            factor_columns,
        )

    @staticmethod
    def _fetch_sync(
        url: str,
        start_date: date,
        end_date: date | None,
        factor_columns: list[str],
    ) -> pd.DataFrame:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
            filename = archive.namelist()[0]

            with archive.open(filename) as file:
                data = pd.read_csv(
                    file,
                    skiprows=3,
                    index_col=0,
                )

        data.index = pd.to_datetime(
            data.index.astype(str),
            format="%Y%m%d",
            errors="coerce",
        )

        data = data.loc[data.index.notna()]

        data.columns = data.columns.str.strip()

        data = data[factor_columns]

        data = data.loc[data.index >= pd.Timestamp(start_date)]

        if end_date is not None:
            data = data.loc[data.index <= pd.Timestamp(end_date)]

        data = data / 100.0

        return data
