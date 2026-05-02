# NetMon Installer v3 - Fully Fixed
# Run as: irm https://raw.githubusercontent.com/thaha-2005/netmon/main/install.ps1 | iex

$ErrorActionPreference = "Continue"

$Desktop    = [Environment]::GetFolderPath("Desktop")
$InstallDir = Join-Path $Desktop "netmon"
$BackendDir = Join-Path $InstallDir "backend"
$FrontendDir= Join-Path $InstallDir "frontend"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   NetMon - Network Monitoring Tool     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[INFO] Install location: $InstallDir" -ForegroundColor White
Write-Host ""

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js not found. Get it from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"; exit 1
}
Write-Host "[OK] Node.js $(node --version)" -ForegroundColor Green

# Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Git not found. Get it from https://git-scm.com/download/win" -ForegroundColor Red
    Read-Host "Press Enter to exit"; exit 1
}
Write-Host "[OK] Git found" -ForegroundColor Green

# Check Nmap
$nmapExe = "C:\Program Files (x86)\Nmap\nmap.exe"
$nmapAlt  = "C:\Program Files\Nmap\nmap.exe"
if (Test-Path $nmapExe) {
    Write-Host "[OK] Nmap found" -ForegroundColor Green
} elseif (Test-Path $nmapAlt) {
    $nmapExe = $nmapAlt
    Write-Host "[OK] Nmap found" -ForegroundColor Green
} elseif (Get-Command nmap -ErrorAction SilentlyContinue) {
    $nmapExe = "nmap"
    Write-Host "[OK] Nmap in PATH" -ForegroundColor Green
} else {
    Write-Host "[WARN] Nmap not found. Install from https://nmap.org/download.html" -ForegroundColor Yellow
    $nmapExe = "C:\Program Files (x86)\Nmap\nmap.exe"
}

Write-Host ""

# Delete old install
if (Test-Path $InstallDir) {
    Write-Host "[INFO] Removing old installation..." -ForegroundColor Yellow
    Set-Location $Desktop
    Start-Sleep -Milliseconds 500
    try {
        Remove-Item -Recurse -Force $InstallDir -ErrorAction Stop
        Write-Host "[OK] Removed old folder" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Cannot delete $InstallDir - it may be open in another window." -ForegroundColor Red
        Write-Host "        Close VS Code / Explorer windows inside that folder, then retry." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"; exit 1
    }
}

# Clone
Write-Host "[INFO] Cloning from GitHub..." -ForegroundColor Cyan
Set-Location $Desktop
git clone https://github.com/thaha-2005/netmon.git 2>&1

if (-not (Test-Path $InstallDir)) {
    Write-Host "[ERROR] Clone failed." -ForegroundColor Red
    Read-Host "Press Enter to exit"; exit 1
}
Write-Host "[OK] Cloned" -ForegroundColor Green

# Verify structure
Write-Host ""
Write-Host "[INFO] Checking folder structure..." -ForegroundColor Cyan

if (-not (Test-Path $BackendDir)) {
    Write-Host "[ERROR] No 'backend' subfolder found in repo!" -ForegroundColor Red
    Write-Host "        Files found in repo root:" -ForegroundColor Yellow
    Get-ChildItem $InstallDir | ForEach-Object { Write-Host "          - $($_.Name)" -ForegroundColor White }
    Write-Host ""
    Write-Host "  You need to organize your GitHub repo into subfolders:" -ForegroundColor Yellow
    Write-Host "  netmon/backend/   <- server.js, package.json, models/, etc." -ForegroundColor Yellow
    Write-Host "  netmon/frontend/  <- index.html, package.json, src/, etc." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Do this in VS Code, then push to GitHub, then re-run installer." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"; exit 1
}

if (-not (Test-Path $FrontendDir)) {
    Write-Host "[ERROR] No 'frontend' subfolder found in repo!" -ForegroundColor Red
    Read-Host "Press Enter to exit"; exit 1
}

Write-Host "[OK] backend/ exists" -ForegroundColor Green
Write-Host "[OK] frontend/ exists" -ForegroundColor Green

# Create .env
$EnvPath = Join-Path $BackendDir ".env"
if (-not (Test-Path $EnvPath)) {
    $envText = "PORT=3001`r`nMONGODB_URI=mongodb://localhost:27017/netmon`r`nMONITOR_INTERVAL_MS=15000`r`nNMAP_PATH=$nmapExe"
    [System.IO.File]::WriteAllText($EnvPath, $envText)
    Write-Host "[OK] Created .env" -ForegroundColor Green
}

# Install backend
Write-Host ""
Write-Host "[INFO] Installing backend packages..." -ForegroundColor Cyan
Set-Location $BackendDir
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Backend npm install failed." -ForegroundColor Red
    Read-Host "Press Enter to exit"; exit 1
}
Write-Host "[OK] Backend ready" -ForegroundColor Green

# Install frontend
Write-Host ""
Write-Host "[INFO] Installing frontend packages..." -ForegroundColor Cyan
Set-Location $FrontendDir
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Frontend npm install failed." -ForegroundColor Red
    Read-Host "Press Enter to exit"; exit 1
}
Write-Host "[OK] Frontend ready" -ForegroundColor Green

# Write START-NETMON.bat
$StartBat = Join-Path $InstallDir "START-NETMON.bat"
$batLines = @(
    "@echo off",
    "echo ========================================",
    "echo    Starting NetMon...",
    "echo ========================================",
    "echo.",
    "start ""NetMon Backend"" cmd /k ""cd /d """ + $BackendDir + """ && node server.js""",
    "timeout /t 3 /nobreak > nul",
    "start ""NetMon Frontend"" cmd /k ""cd /d """ + $FrontendDir + """ && npm run dev""",
    "timeout /t 4 /nobreak > nul",
    "start http://localhost:5173",
    "echo NetMon launched! Two windows will open for backend and frontend.",
    "echo Close them to stop NetMon."
)
[System.IO.File]::WriteAllLines($StartBat, $batLines)
Write-Host "[OK] Created START-NETMON.bat" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "       Installation Complete!           " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  To start NetMon anytime:" -ForegroundColor Cyan
Write-Host "  Double-click  START-NETMON.bat  on your Desktop" -ForegroundColor White
Write-Host ""

$launch = Read-Host "Launch NetMon now? (y/n)"
if ($launch -eq 'y') {
    Start-Process "cmd.exe" -ArgumentList "/k cd /d `"$BackendDir`" && node server.js"
    Start-Sleep -Seconds 3
    Start-Process "cmd.exe" -ArgumentList "/k cd /d `"$FrontendDir`" && npm run dev"
    Start-Sleep -Seconds 4
    Start-Process "http://localhost:5173"
    Write-Host "[OK] NetMon launched!" -ForegroundColor Green
}
