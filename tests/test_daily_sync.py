# 일일 동기화 스케줄이 평일 장 마감 후를 가리키는지 검증한다.
import unittest
from datetime import datetime

from daily_sync_loop import KST, next_run


class DailySyncScheduleTest(unittest.TestCase):
    def test_runs_same_day_before_close(self):
        self.assertEqual(next_run(datetime(2026, 8, 25, 10, 0, tzinfo=KST)), datetime(2026, 8, 25, 16, 30, tzinfo=KST))

    def test_moves_to_next_weekday_after_close(self):
        self.assertEqual(next_run(datetime(2026, 8, 25, 16, 31, tzinfo=KST)), datetime(2026, 8, 26, 16, 30, tzinfo=KST))

    def test_skips_weekend_after_friday_close(self):
        self.assertEqual(next_run(datetime(2026, 8, 28, 16, 31, tzinfo=KST)), datetime(2026, 8, 31, 16, 30, tzinfo=KST))

    def test_weekend_morning_waits_for_monday(self):
        self.assertEqual(next_run(datetime(2026, 8, 29, 9, 0, tzinfo=KST)), datetime(2026, 8, 31, 16, 30, tzinfo=KST))


if __name__ == "__main__":
    unittest.main()
