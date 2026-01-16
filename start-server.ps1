# start-server.ps1
# Simple script to start a local static server for the silly-cats-game
Write-Host "Attempting to start a local static server for silly-cats-game..."
if (Get-Command npx -ErrorAction SilentlyContinue) {
  Write-Host "Using npx http-server on port 8000"
  npx http-server -p 8000
} else {
  Write-Host "npx not found, trying Python HTTP server on port 8000"
  python -m http.server 8000
}

Write-Host "Server stopped"
