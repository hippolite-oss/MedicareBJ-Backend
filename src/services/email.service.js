/**
 * services/email.service.js — Envoi d'emails via Nodemailer
 */
const fs = require("fs");
const path = require("path");
const { getTransporter } = require("../config/mailer");
const logger = require("../utils/logger");

/**
 * Charge un template HTML et remplace les variables
 */
function loadTemplate(templateName, variables = {}) {
  const templatePath = path.join(
    __dirname,
    "../templates/emails",
    `${templateName}.html`,
  );
  let html = fs.readFileSync(templatePath, "utf-8");
  Object.entries(variables).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  });
  return html;
}

const emailService = {
  async send({ to, subject, template, variables = {}, html: rawHtml = null }) {
    try {
      const transporter = getTransporter();
      const html = rawHtml || loadTemplate(template, variables);

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "MediCare BJ <noreply@medicarebi.bj>",
        to,
        subject,
        html,
      });

      logger.info(`Email envoyé à ${to} : ${subject}`);
    } catch (err) {
      logger.error(`Erreur envoi email à ${to} :`, err.message);
      // Ne pas propager l'erreur pour ne pas bloquer le flux principal
    }
  },

  async sendBienvenue(user) {
    await this.send({
      to: user.email,
      subject: "✅ Votre compte MediCare BJ a été créé",
      template: "bienvenue",
      variables: { prenom: user.prenom, app_url: process.env.FRONTEND_URL },
    });
  },

  async sendInscriptionPro(user) {
    const role_label =
      user.role === "medecin" ? "Médecin" : "Technicien de laboratoire";
    await this.send({
      to: user.email,
      subject: "⏳ Votre inscription MediCare BJ est en cours d'examen",
      template: "inscriptionPro",
      variables: {
        prenom: user.prenom,
        role_label,
        app_url: process.env.FRONTEND_URL,
      },
    });
  },

  async sendValidationCompte(user) {
    await this.send({
      to: user.email,
      subject: "Votre compte MediCare BJ a été validé",
      template: "validationCompte",
      variables: { nom: user.prenom, app_url: process.env.FRONTEND_URL },
    });
  },

  async sendRejetCompte(user, motif) {
    await this.send({
      to: user.email,
      subject: "Mise à jour de votre inscription MediCare BJ",
      template: "rejetCompte",
      variables: { nom: user.prenom, motif, app_url: process.env.FRONTEND_URL },
    });
  },

  async sendResetPassword(user, resetUrl) {
    await this.send({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe MediCare BJ",
      template: "resetPassword",
      variables: {
        nom: user.prenom,
        lien: resetUrl,
        app_url: process.env.FRONTEND_URL,
      },
    });
  },

  async sendRdvConfirmation(patient, rdv, medecin) {
    await this.send({
      to: patient.email,
      subject: "Confirmation de votre rendez-vous",
      template: "rdvConfirmation",
      variables: {
        nom: patient.prenom,
        medecin: `Dr. ${medecin.prenom} ${medecin.nom}`,
        date: new Date(rdv.date_heure).toLocaleString("fr-BJ"),
        motif: rdv.motif || "Consultation",
        app_url: process.env.FRONTEND_URL,
      },
    });
  },

  async sendRdvRappel(patient, rdv, medecin) {
    await this.send({
      to: patient.email,
      subject: "Rappel : Rendez-vous demain",
      template: "rdvRappel",
      variables: {
        nom: patient.prenom,
        medecin: `Dr. ${medecin.prenom} ${medecin.nom}`,
        date: new Date(rdv.date_heure).toLocaleString("fr-BJ"),
        app_url: process.env.FRONTEND_URL,
      },
    });
  },
};

module.exports = { emailService };
