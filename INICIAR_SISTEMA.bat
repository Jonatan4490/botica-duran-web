@echo off
echo ================================
echo  BOTICA DURAN - INICIAR SISTEMA
echo ================================
echo.

echo [1/3] Verificando MySQL...
echo Por favor asegurate de que MySQL este corriendo.
pause

echo.
echo [2/3] Iniciando Backend...
echo.
start cmd /k "cd /d %~dp0backend && echo Iniciando Backend... && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo [3/3] Iniciando Frontend...
echo.
start cmd /k "cd /d %~dp0frontend && echo Iniciando Frontend... && npm run dev"

echo.
echo ================================
echo  SISTEMA INICIADO CORRECTAMENTE
echo ================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Usuario: admin
echo Password: admin123
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
