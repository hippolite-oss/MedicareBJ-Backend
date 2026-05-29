/**
 * Script pour vider le cache Redis
 * Usage: node clear-cache.js
 */

const { cacheService } = require('./src/services/cache.service');

async function clearCache() {
  try {
    console.log('🔄 Vidage du cache Redis en cours...');
    
    // Vider tous les caches liés aux hôpitaux
    await cacheService.del('hopitaux:*');
    console.log('✅ Cache des hôpitaux vidé');
    
    // Vider tous les caches liés aux médicaments
    await cacheService.del('medicaments:*');
    console.log('✅ Cache des médicaments vidé');
    
    console.log('🎉 Cache vidé avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du vidage du cache:', error.message);
    process.exit(1);
  }
}

clearCache();
