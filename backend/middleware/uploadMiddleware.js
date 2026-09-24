import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads folder exists
const uploadPath = "uploads/";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// ===============================
// IMAGE FILTER
// ===============================
const imageFileFilter = (req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|gif/;

  const extname = allowedExt.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mimetype = allowedExt.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only image files (jpeg, jpg, png, gif) are allowed"
      )
    );
  }
};

// ===============================
// RESUME FILTER
// ===============================
const resumeFileFilter = (req, file, cb) => {
  const allowedExtensions = [".pdf", ".txt", ".md"];

  const ext = path
    .extname(file.originalname)
    .toLowerCase();

  const allowedMimeTypes = [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/octet-stream",
  ];

  if (
    allowedExtensions.includes(ext) ||
    allowedMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, TXT, and MD files are allowed"
      )
    );
  }
};

// ===============================
// IMAGE UPLOAD
// ===============================
export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ===============================
// RESUME UPLOAD
// ===============================
export const uploadResume = multer({
  storage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Default export (optional)
export default uploadImage;