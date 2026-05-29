/**
 * utils/pagination.js — Utilitaire de pagination
 */

/**
 * Extrait les paramètres de pagination depuis la query
 */
function getPagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Construit les métadonnées de pagination
 */
function buildMeta(total, page, limit) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = { getPagination, buildMeta };
