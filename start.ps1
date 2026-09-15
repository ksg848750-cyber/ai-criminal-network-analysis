param (
    [switch]$Ingest
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " CRIMINAL NETWORK INTELLIGENCE MVP" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Neo4j is available on 7687
$tcpClient = New-Object System.Net.Sockets.TcpClient
try {
    $tcpClient.Connect("127.0.0.1", 7687)
    Write-Host "[OK] Neo4j is reachable on port 7687." -ForegroundColor Green
    $tcpClient.Close()
} catch {
    Write-Host "[WARNING] Could not reach Neo4j on port 7687. Ensure Neo4j Desktop is running." -ForegroundColor Yellow
}

# Start Backend
Write-Host "Starting FastAPI Backend..." -ForegroundColor Cyan
$env:NEO4J_PASSWORD="Karthik02@"
$env:PYTHONPATH="src/backend"
Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --reload --port 8000 --app-dir src/backend" -NoNewWindow -PassThru

# Wait a moment for backend to initialize
Start-Sleep -Seconds 3

# Run Ingestion if requested
if ($Ingest) {
    Write-Host "Running ingestion pipeline..." -ForegroundColor Cyan
    try {
        Invoke-RestMethod -Method Post -Uri "http://localhost:8000/ingest?filepath=data/sample/crime_records.csv"
        Write-Host "[OK] Ingestion completed successfully." -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to run ingestion. Is the backend running?" -ForegroundColor Red
    }
} else {
    Write-Host "Skipping ingestion (use -Ingest flag if you need a fresh database load)." -ForegroundColor Gray
}

# Start Frontend
Write-Host "Starting Vite React Frontend..." -ForegroundColor Cyan
Set-Location "src/frontend"
npm run dev
