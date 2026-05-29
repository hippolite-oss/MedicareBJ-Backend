/**
 * Includes Sequelize communs pour les analyses
 */
const analyseIncludes = [
  {
    association: "demandeur",
    attributes: ["id", "nom", "prenom", "role"],
  },
  {
    association: "realisateur",
    attributes: ["id", "nom", "prenom", "role"],
  },
];

module.exports = { analyseIncludes };
