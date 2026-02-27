@echo off
echo ========================================
echo   CodeVault - Start All Services
echo ========================================
echo.
echo Starting Hardhat Node in new window...
start "Hardhat Node" cmd /k "cd blockchain && npx hardhat node"

timeout /t 5 /nobreak > nul

echo Deploying Smart Contract...
cd blockchain
call npx hardhat run scripts/deploy.js --network localhost
cd ..

echo.
echo Starting Backend Server in new window...
start "Backend API" cmd /k "cd backend && npm start"

timeout /t 2 /nobreak > nul

echo.
echo Starting Frontend in new window...
start "React Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   All services starting...
echo ========================================
echo.
echo Services:
echo   - Hardhat Node: http://localhost:8545
echo   - Backend API:  http://localhost:3001
echo   - Frontend:     http://localhost:3000
echo.
echo Press any key to exit this window...
pause > nul
