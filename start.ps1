# ─── AI Interview Copilot - Start All Servers ─────────────────────
Write-Host "🚀 Starting AI Interview Copilot..." -ForegroundColor Cyan

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\ai project\ai-interview-copilot\backend'; node index.js" -WindowStyle Normal

# Wait a moment then start Frontend
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\ai project\ai-interview-copilot\frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Backend  → http://localhost:5000" -ForegroundColor Green
Write-Host "✅ Frontend → http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"
