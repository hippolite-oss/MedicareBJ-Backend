# Script PowerShell pour corriger le problème des hôpitaux
# Usage: .\fix-hopitaux.ps1

Write-Host "🔧 Correction du problème des hôpitaux" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Vider le cache Redis
Write-Host "📝 Étape 1/3: Vidage du cache Redis..." -ForegroundColor Yellow
try {
    node clear-cache.js
    Write-Host "✅ Cache vidé avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du vidage du cache: $_" -ForegroundColor Red
    Write-Host "Continuons quand même..." -ForegroundColor Yellow
}

Write-Host ""

# Étape 2: Information sur le redémarrage
Write-Host "📝 Étape 2/3: Redémarrage du backend" -ForegroundColor Yellow
Write-Host "⚠️  IMPORTANT: Vous devez redémarrer le serveur backend manuellement" -ForegroundColor Red
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Cyan
Write-Host "1. Arrêtez le serveur backend (Ctrl+C dans son terminal)"
Write-Host "2. Relancez-le avec: npm start"
Write-Host "3. Attendez le message de confirmation"
Write-Host ""

# Étape 3: Information sur le cache navigateur
Write-Host "📝 Étape 3/3: Cache du navigateur" -ForegroundColor Yellow
Write-Host "Dans votre navigateur:" -ForegroundColor Cyan
Write-Host "1. Appuyez sur Ctrl+Shift+R (hard refresh)"
Write-Host "2. Ou ouvrez la console (F12) et tapez: localStorage.clear()"
Write-Host ""

Write-Host "🎉 Script terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Redémarrer le backend (voir instructions ci-dessus)"
Write-Host "2. Rafraîchir le navigateur (Ctrl+Shift+R)"
Write-Host "3. Vérifier que les 7 hôpitaux s'affichent"
Write-Host ""
Write-Host "📚 Pour plus de détails, consultez: SOLUTION_COMPLETE_HOPITAUX.md" -ForegroundColor Cyan
