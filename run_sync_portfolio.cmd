:: Windows 작업 스케줄러에서 프로젝트 폴더 기준으로 동기화를 실행한다.
@echo off
cd /d "%~dp0"
"C:\Python313\python.exe" sync_portfolio.py
