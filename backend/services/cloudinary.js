const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ─── Configure Cloudinary ────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Configure Multer Storage → Cloudinary ───────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ai-interview-copilot/resumes',
    allowed_formats: ['pdf'],
    resource_type: 'raw', // required for non-image files like PDFs
    public_id: (req, file) => {
      const timestamp = Date.now();
      const name = file.originalname.replace(/\.[^/.]+$/, ''); // strip extension
      return `resume_${timestamp}_${name}`;
    },
  },
});

// ─── Multer Upload Middleware ─────────────────────────────────────
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
});

module.exports = { cloudinary, upload };
