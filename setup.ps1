# CodeVault Setup Script for Windows
# Run this in PowerShell as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CodeVault P2P Marketplace Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "✓ $pythonVersion installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install from https://python.org/" -ForegroundColor Red
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

# Install Backend dependencies
Write-Host "Installing Backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
Set-Location ..

# Install Frontend dependencies
Write-Host "Installing Frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
Set-Location ..

# Install Blockchain dependencies
Write-Host "Installing Blockchain dependencies..." -ForegroundColor Cyan
Set-Location blockchain
npm install
Set-Location ..

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
Set-Location backend
pip install -r requirements.txt
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Install Kubo (IPFS) from https://docs.ipfs.tech/install/" -ForegroundColor White
Write-Host "2. Run 'npm run node' in blockchain folder to start local testnet" -ForegroundColor White
Write-Host "3. Run 'npm run deploy' in blockchain folder to deploy contract" -ForegroundColor White
Write-Host "4. Run 'npm start' in backend folder to start API server" -ForegroundColor White
Write-Host "5. Run 'npm start' in frontend folder to start React app" -ForegroundColor White
Write-Host ""
