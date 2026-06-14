const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile, downloadFile, deleteFile, searchFiles } = require('../controllers/fileController');
const auth = require('../middleware/auth');

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file PDF yang diizinkan!'));
  }
};

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: fileFilter
});

router.get('/search', auth, searchFiles);
router.post('/upload', auth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Ukuran file maksimal 10 MB.' });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, uploadFile);
router.get('/:id/download', auth, downloadFile);
router.delete('/:id', auth, deleteFile);

module.exports = router;
