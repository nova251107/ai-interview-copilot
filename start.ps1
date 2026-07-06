# AI Interview Copilot - Start Script
$projectRoot = $PSScriptRoot

Write-Host "Starting AI Interview Copilot..." -ForegroundColor Cyan

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; node index.js"

Start-Sleep -Seconds 2

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm run dev"

Start-Sleep -Seconds 3

# Open browser
Start-Process 'http://localhost:3000'

Write-Host "Both servers started! Opening browser..." -ForegroundColor Green
