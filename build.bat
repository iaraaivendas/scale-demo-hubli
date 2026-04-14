@echo off
echo ========================================
echo   I.Ara Scale - Build para producao
echo ========================================

echo.
echo [1/2] Buildando frontend...
cd platform
call npm run build
if %errorlevel% neq 0 (
  echo ERRO no build do frontend!
  pause
  exit /b 1
)

cd ..
echo.
echo [2/2] Build concluido!
echo.
echo Pasta gerada: backend\public\
echo.
echo Proximo passo: fazer upload para a VPS
pause
