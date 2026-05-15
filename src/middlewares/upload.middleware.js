import multer from 'multer';
import path from 'path';

const ALLOWED_EXTENSIONS = new Set([
  'jpeg',
  'jpg',
  'png',
  'gif',
  'webp',
  'pdf',
  'doc',
  'docx',
  'mp4',
  'mp3',
]);

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'audio/mpeg',
  'audio/mp3',
]);

const MAX_SIZE_MB = 10;

// memoryStorage — no disk writes, buffer goes straight to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype.toLowerCase();

  if (ALLOWED_EXTENSIONS.has(ext) || ALLOWED_MIMES.has(mime)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${ext || mime}`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});
