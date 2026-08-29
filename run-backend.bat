@echo off
echo Starting TrueBorrow Backend Server...
cd backend

:: Check if standard python has uvicorn
python -c "import uvicorn" 2>nul
if %errorlevel% equ 0 (
    python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
) else (
    echo Using Python 3.14 path...
    "C:\Users\Vinit\AppData\Local\Programs\Python\Python314\python.exe" -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
)
pause
