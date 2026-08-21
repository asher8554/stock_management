# 토스증권 환경 변수 호환성을 검증한다.
import os
import tempfile
import unittest
from pathlib import Path

from sync_portfolio import holding_item, load_env, toss_credentials


class TossCredentialsTest(unittest.TestCase):
    def test_loads_open_api_key_names(self):
        old = {name: os.environ.pop(name, None) for name in ("TOSS_CLIENT_ID", "TOSS_CLIENT_SECRET", "TOSS_CLIENT_KEY", "TOSS_SECRET_KEY")}
        try:
            with tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / ".env"
                path.write_text("TOSS_CLIENT_KEY=client\nTOSS_SECRET_KEY=secret\n", encoding="utf-8")
                load_env(path)
                self.assertEqual(toss_credentials(), ("client", "secret"))
        finally:
            for name, value in old.items():
                if value is not None:
                    os.environ[name] = value
                else:
                    os.environ.pop(name, None)

    def test_flattens_holding_market_value(self):
        self.assertEqual(holding_item({"symbol": "005930", "marketValue": {"amount": "72000"}}), {"symbol": "005930", "name": None, "marketCountry": None, "currency": None, "quantity": None, "lastPrice": None, "averagePurchasePrice": None, "marketValue": "72000"})


if __name__ == "__main__":
    unittest.main()
