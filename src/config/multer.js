/**
 * config/multer.js — Configuration Multer pour les uploads
 */
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Stockage disque
const fs = require("fs");

const storage = (destination) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(
        process.env.UPLOAD_PATH || "./uploads",
        destination,
      );
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });

// Filtre images
const imageFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else
    cb(
      new Error("Format image non supporté. Utilisez JPG, PNG ou WebP."),
      false,
    );
};

// Filtre documents
const documentFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Format non supporté. Utilisez PDF, JPG ou PNG."), false);
};

// Upload avatar
const uploadAvatar = multer({
  storage: storage("avatars"),
  fileFilter: imageFilter,
  limits: {
    fileSize: parseInt(process.env.AVATAR_MAX_SIZE) || 5 * 1024 * 1024,
  },
});

// Upload analyse
const uploadAnalyse = multer({
  storage: storage("analyses"),
  fileFilter: documentFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024,
  },
});

// Upload document général
const uploadDocument = multer({
  storage: storage("documents"),
  fileFilter: documentFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024,
  },
});

const uploadMessageMedia = multer({
  storage: storage("messages"),
  fileFilter: imageFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024,
  },
});

module.exports = {
  uploadAvatar,
  uploadAnalyse,
  uploadDocument,
  uploadMessageMedia,
};
