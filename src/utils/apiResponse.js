/**
 * utils/apiResponse.js — Format standard des réponses API
 */

/**
 * Réponse succès
 */
function success(res, data = null, message = 'Opération réussie', statusCode = 200) {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
}

/**
 * Réponse succès avec pagination
 */
function paginated(res, data, meta, message = 'Données récupérées') {
  return res.status(200).json({ success: true, message, data, meta });
}

/**
 * Réponse création
 */
function created(res, data, message = 'Ressource créée avec succès') {
  return res.status(201).json({ success: true, message, data });
}

/**
 * Réponse erreur
 */
function error(res, message, statusCode = 500, code = 'SERVER_ERROR', errors = null) {
  const response = { success: false, message, code };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
}

/**
 * Réponse 400 Bad Request
 */
function badRequest(res, message = 'Données invalides', errors = null) {
  return error(res, message, 400, 'BAD_REQUEST', errors);
}

/**
 * Réponse 401 Unauthorized
 */
function unauthorized(res, message = 'Non authentifié') {
  return error(res, message, 401, 'UNAUTHORIZED');
}

/**
 * Réponse 403 Forbidden
 */
function forbidden(res, message = 'Accès refusé') {
  return error(res, message, 403, 'FORBIDDEN');
}

/**
 * Réponse 404 Not Found
 */
function notFound(res, message = 'Ressource introuvable') {
  return error(res, message, 404, 'NOT_FOUND');
}

/**
 * Réponse 409 Conflict
 */
function conflict(res, message = 'Conflit de données') {
  return error(res, message, 409, 'CONFLICT');
}

/**
 * Réponse 422 Unprocessable
 */
function unprocessable(res, message = 'Erreur de validation métier') {
  return error(res, message, 422, 'UNPROCESSABLE');
}

/**
 * Réponse 429 Too Many Requests
 */
function tooManyRequests(res, message = 'Trop de requêtes') {
  return error(res, message, 429, 'TOO_MANY_REQUESTS');
}

module.exports = {
  success, paginated, created, error,
  badRequest, unauthorized, forbidden,
  notFound, conflict, unprocessable, tooManyRequests,
};
