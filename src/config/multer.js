/**
 * config/multer.js — Configuration Multer avec stockage mémoire (upload vers Cloudinary)
 */
const multer = require("multer");

// Stockage en mémoire (buffer), pas sur disque
const memoryStorage = multer.memoryStorage();

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

// Filtre documents (PDF + images)
const documentFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Format non supporté. Utilisez PDF, JPG ou PNG."), false);
};

// Upload avatar
const uploadAvatar = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: parseInt(process.env.AVATAR_MAX_SIZE) || 5 * 1024 * 1024,
  },
});

// Upload analyse
const uploadAnalyse = multer({
  storage: memoryStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024,
  },
});

// Upload document général
const uploadDocument = multer({
  storage: memoryStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024,
  },
});

const uploadMessageMedia = multer({
  storage: memoryStorage,
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