import multer from 'multer';
import path from 'path';

const ALLOWED_TYPES = /jpeg|jpg|png|gif|webp|pdf|doc|docx|mp4|mp3/;
const MAX_SIZE_MB = 10;

// Use memoryStorage — files are kept as Buffer in req.file.buffer
// and uploaded directly to Cloudinary (no local disk writes)
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype;

  if (ALLOWED_TYPES.test(ext) || ALLOWED_TYPES.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${ext}`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});
