/**
 * services/pdf.service.js — Génération PDF (ordonnances, reçus)
 */
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const { formatDateFR, calculateAge } = require("../utils/formatDate");

const pdfService = {
  /**
   * Génère une ordonnance PDF
   * @returns {Buffer} Buffer PDF
   */
  async genererOrdonnance(
    prescription,
    medecin,
    patient,
    medicaments,
    numeroDossier,
  ) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const primaryColor = "#1A6B8A";
      const grayColor = "#666666";

      // ── En-tête ──────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
      doc
        .fillColor("white")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("MediCare BJ", 50, 30);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Carnet de soins numérique", 50, 58)
        .text("www.medicarebi.bj", 50, 72);

      doc
        .fillColor(primaryColor)
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("ORDONNANCE MÉDICALE", 0, 115, { align: "center" });

      // ── Infos médecin ─────────────────────────────────────
      doc.moveTo(50, 145).lineTo(545, 145).stroke(primaryColor);
      doc
        .fillColor("#333")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(`Dr. ${medecin.prenom} ${medecin.nom}`, 50, 155);
      doc
        .fillColor(grayColor)
        .fontSize(10)
        .font("Helvetica")
        .text(medecin.professionnel?.specialite || "", 50, 170)
        .text(
          `N° Ordre : ${medecin.professionnel?.numero_ordre || ""}`,
          50,
          183,
        )
        .text(`Date : ${formatDateFR(new Date())}`, 400, 155);

      // ── Infos patient ─────────────────────────────────────
      doc.rect(50, 205, 495, 55).fill("#F0F7FA").stroke("#D0E8F0");
      doc
        .fillColor("#333")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("PATIENT", 60, 213);
      doc
        .font("Helvetica")
        .fillColor("#333")
        .text(`${patient.prenom} ${patient.nom}`, 60, 226)
        .text(
          `Né(e) le : ${patient.date_naissance ? formatDateFR(patient.date_naissance) : "N/A"} — ${patient.date_naissance ? calculateAge(patient.date_naissance) + " ans" : ""}`,
          60,
          239,
        )
        .text(
          `N° Dossier : ${numeroDossier || prescription.numero_dossier || prescription.id_dossier}`,
          60,
          252,
        );

      // ── Médicaments ───────────────────────────────────────
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("MÉDICAMENTS PRESCRITS", 50, 280);
      doc.moveTo(50, 296).lineTo(545, 296).stroke(primaryColor);

      let y = 308;
      medicaments.forEach((med, i) => {
        if (y > 680) {
          doc.addPage();
          y = 50;
        }

        // Les champs peuvent venir directement ou depuis MedicamentPrescrit (table pivot)
        const nomMed = med.nom_medicament ?? med.nom ?? "Médicament";
        const dosageMed =
          med.MedicamentPrescrit?.dosage ??
          med.dosage ??
          med.MedicamentPrescrit?.dosage ??
          "N/A";
        const formeMed = med.forme ?? "N/A";
        const frequenceMed =
          med.MedicamentPrescrit?.frequence ?? med.frequence ?? "N/A";
        const dureeMed = med.MedicamentPrescrit?.duree_jours ?? med.duree_jours;
        const instrMed =
          med.MedicamentPrescrit?.instructions ?? med.instructions;

        doc
          .fillColor(primaryColor)
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(`${i + 1}. ${nomMed}`, 50, y);
        y += 16;
        doc
          .fillColor("#333")
          .fontSize(10)
          .font("Helvetica")
          .text(`Dosage : ${dosageMed} — Forme : ${formeMed}`, 65, y);
        y += 14;
        doc.text(
          `Fréquence : ${frequenceMed} — Durée : ${dureeMed ? dureeMed + " jours" : "N/A"}`,
          65,
          y,
        );
        y += 14;
        if (instrMed) {
          doc.fillColor(grayColor).text(`Instructions : ${instrMed}`, 65, y);
          y += 14;
        }
        y += 8;
      });

      if (prescription.instructions_generales) {
        y += 10;
        doc.rect(50, y, 495, 50).fill("#FFF9E6").stroke("#FFD700");
        doc
          .fillColor("#333")
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Instructions générales :", 60, y + 8);
        doc
          .font("Helvetica")
          .text(prescription.instructions_generales, 60, y + 22, {
            width: 475,
          });
        y += 60;
      }

      // ── Signature ─────────────────────────────────────────
      const sigY = Math.max(y + 30, 700);
      doc.moveTo(350, sigY).lineTo(545, sigY).stroke("#333");
      doc
        .fillColor("#333")
        .fontSize(9)
        .font("Helvetica")
        .text(`Dr. ${medecin.prenom} ${medecin.nom}`, 350, sigY + 5, {
          width: 195,
          align: "center",
        })
        .text(medecin.professionnel?.specialite || "", 350, sigY + 17, {
          width: 195,
          align: "center",
        });

      // ── Pied de page ──────────────────────────────────────
      doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill("#F5F5F5");
      doc
        .fillColor(grayColor)
        .fontSize(8)
        .text(
          `Ordonnance N° ${prescription.numero_ordonnance} — Générée le ${formatDateFR(new Date())} — MediCare BJ`,
          50,
          doc.page.height - 25,
          { align: "center" },
        );

      doc.end();
    });
  },

  /**
   * Génère un reçu de paiement PDF
   * @returns {Buffer} Buffer PDF
   */
  async genererRecu(paiement, patient) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A5", margin: 40 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const primaryColor = "#1A6B8A";

      // En-tête
      doc.rect(0, 0, doc.page.width, 70).fill(primaryColor);
      doc
        .fillColor("white")
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("MediCare BJ", 40, 20);
      doc.fontSize(9).font("Helvetica").text("REÇU DE PAIEMENT", 40, 45);

      // Numéro reçu
      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(`N° ${paiement.numero_recu}`, 0, 85, { align: "center" });

      doc
        .fillColor("#333")
        .fontSize(10)
        .font("Helvetica")
        .text(
          `Date : ${formatDateFR(paiement.date_paiement || new Date())}`,
          40,
          110,
        )
        .text(`Patient : ${patient.prenom} ${patient.nom}`, 40, 126)
        .text(
          `Mode : ${paiement.mode_paiement.replace("_", " ").toUpperCase()}`,
          40,
          142,
        )
        .text(
          `Référence : ${paiement.reference_externe || paiement.id}`,
          40,
          158,
        );

      // Montant
      doc.rect(40, 180, doc.page.width - 80, 50).fill("#F0F7FA");
      doc
        .fillColor(primaryColor)
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(
          `${Number(paiement.montant).toLocaleString("fr-BJ")} FCFA`,
          0,
          195,
          { align: "center" },
        );

      doc
        .fillColor("#666")
        .fontSize(8)
        .font("Helvetica")
        .text(
          "Ce reçu est généré automatiquement par MediCare BJ",
          0,
          doc.page.height - 30,
          { align: "center" },
        );

      doc.end();
    });
  },

  /**
   * Sauvegarde un buffer PDF sur disque
   */
  async sauvegarder(buffer, filename, subfolder = "documents") {
    const dir = path.join(process.env.UPLOAD_PATH || "./uploads", subfolder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, buffer);
    return `/uploads/${subfolder}/${filename}`;
  },
};

module.exports = { pdfService };
