@echo off
echo ========================================
echo   MediCare BJ - Demarrage Backend
echo ========================================
echo.

echo [1/3] Arret des processus Node.js existants...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo       OK - Processus arretes
) else (
    echo       OK - Aucun processus a arreter
)

echo.
echo [2/3] Attente de liberation du port...
timeout /t 2 /nobreak >nul
echo       OK - Port libre

echo.
echo [3/3] Demarrage du serveur...
echo.
echo ========================================
echo   Serveur en cours de demarrage...
echo   Attendez le message de confirmation
echo ========================================
echo.

npm run dev
