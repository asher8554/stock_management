# NAS에서 평일 장 마감 후(KST 16:30) 계좌 스냅샷을 하루 한 번 동기화한다.
import time
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
RUN_HOUR = 16
RUN_MINUTE = 30


def next_run(now=None):
    current = now or datetime.now(KST)
    run = current.replace(hour=RUN_HOUR, minute=RUN_MINUTE, second=0, microsecond=0)
    if run <= current:
        run += timedelta(days=1)
    while run.weekday() >= 5:
        run += timedelta(days=1)
    return run


def main():
    from sync_portfolio import load_env
    from sync_portfolio import main as sync_main
    load_env()
    while True:
        target = next_run()
        print(f"next daily sync: {target.isoformat()}", flush=True)
        time.sleep(max(1, (target - datetime.now(KST)).total_seconds()))
        try:
            sync_main()
            print("daily sync completed", flush=True)
        except Exception as error:
            print(f"daily sync failed: {error}", flush=True)
        time.sleep(60)


if __name__ == "__main__":
    main()
