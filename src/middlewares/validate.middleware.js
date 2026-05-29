/**
 * middlewares/validate.middleware.js — Validation Joi
 */
const { badRequest } = require('../utils/apiResponse');

/**
 * Valide le body de la requête avec un schéma Joi
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return badRequest(res, 'Données invalides', errors);
    }

    req.body = value;
    next();
  };
}

/**
 * Valide les query params
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return badRequest(res, 'Paramètres invalides', errors);
    }

    req.query = value;
    next();
  };
}

module.exports = { validate, validateQuery };
