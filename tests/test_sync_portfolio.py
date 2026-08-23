# 동기화 스크립트의 환경 변수 정책과 KIS·KRX 응답 변환을 검증한다.
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from sync_portfolio import kis_snapshot, krx_metric, load_env, request_json


class SyncPortfolioTest(unittest.TestCase):
    def test_env_file_overrides_stale_ingest_token(self):
        previous = os.environ.get("PORTFOLIO_INGEST_TOKEN")
        try:
            os.environ["PORTFOLIO_INGEST_TOKEN"] = "stale"
            with tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / ".env"
                path.write_text("PORTFOLIO_INGEST_TOKEN=current\n", encoding="utf-8")
                load_env(path)
                self.assertEqual(os.environ["PORTFOLIO_INGEST_TOKEN"], "current")
        finally:
            if previous is None:
                os.environ.pop("PORTFOLIO_INGEST_TOKEN", None)
            else:
                os.environ["PORTFOLIO_INGEST_TOKEN"] = previous

    def test_sets_user_agent_for_cloudflare_worker_requests(self):
        with patch("sync_portfolio.urlopen") as urlopen:
            urlopen.return_value.__enter__.return_value.read.return_value = b"{}"
            request_json("https://worker.example/v1/snapshot")
            self.assertEqual(urlopen.call_args.args[0].get_header("User-agent"), "stock-management-sync/1.0")

    def test_kis_snapshot_includes_cash_and_stock_value(self):
        account = kis_snapshot({
            "output1": [{"hldg_qty": "2", "evlu_amt": "3000"}],
            "output2": [{"dnca_tot_amt": "7000", "tot_evlu_amt": "10000", "scts_evlu_amt": "3000"}],
        })
        self.assertEqual(account["cash"], "7000")
        self.assertEqual(account["stockValue"], "3000")

    def test_krx_metric_uses_matching_daily_row(self):
        with patch("sync_portfolio.request_json", return_value={"OutBlock_1": [{"IDX_NM": "코스피 100", "CLSPRC_IDX": "1000", "BAS_DD": "20260820"}]}):
            with patch.dict(os.environ, {"KRX_API_KEY": "key"}):
                self.assertEqual(krx_metric("https://krx.example", "IDX_NM", "코스피 100", "CLSPRC_IDX", "pt")["value"], "1000")


if __name__ == "__main__":
    unittest.main()
