// Therapy/middlewares/upload.middlewares.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the base upload directory relative to the project root (Therapy/)
const UPLOAD_BASE_DIR = path.join(__dirname, '..', 'uploads'); // Go up from 'middlewares' to 'Therapy' then into 'uploads'
const PROFILE_PICTURES_DIR = path.join(UPLOAD_BASE_DIR, 'profile-pictures');

// Ensure the directory exists
if (!fs.existsSync(PROFILE_PICTURES_DIR)) {
  fs.mkdirSync(PROFILE_PICTURES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // This `destination` path is now an absolute path, which is more reliable
    cb(null, PROFILE_PICTURES_DIR);
  },
  filename: function (req, file, cb) {
    // Assuming req.user.userId is populated by your authentication middleware
    const userId = req.user && req.user.userId ? req.user.userId : 'unknown-user';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;