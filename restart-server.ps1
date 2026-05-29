# Script PowerShell pour redémarrer proprement le serveur backend
# Usage: .\restart-server.ps1

Write-Host "🔍 Recherche des processus sur le port 5000..." -ForegroundColor Yellow

# Trouver tous les processus qui utilisent le port 5000
$processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | 
             Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "📋 Processus trouvés: $($processes -join ', ')" -ForegroundColor Cyan
    
    foreach ($pid in $processes) {
        try {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "🛑 Arrêt du processus $($process.Name) (PID: $pid)..." -ForegroundColor Red
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "✅ Processus $pid arrêté" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️  Impossible d'arrêter le processus $pid : $_" -ForegroundColor Yellow
        }
    }
    
    # Attendre que les ports soient libérés
    Write-Host "⏳ Attente de la libération du port..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ Aucun processus n'utilise le port 5000" -ForegroundColor Green
}

# Vérifier que le port est libre
$stillUsed = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($stillUsed) {
    Write-Host "❌ Le port 5000 est toujours utilisé!" -ForegroundColor Red
    Write-Host "Essayez de redémarrer votre ordinateur ou utilisez un autre port." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Port 5000 libéré!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Démarrage du serveur backend..." -ForegroundColor Cyan
Write-Host ""

# Démarrer le serveur
npm run dev
