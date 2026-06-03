@echo off
setlocal

cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  py -3 server.py --open-page host
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  python server.py --open-page host
  goto :eof
)

echo Python was not found on this system.
echo Install Python, then run this starter again.
pause
