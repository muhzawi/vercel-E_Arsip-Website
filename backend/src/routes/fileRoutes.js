const express = require('express');
const router = express.Router();
const { getSignedUploadUrl, saveFileMetadata, downloadFile, deleteFile, searchFiles } = require('../controllers/fileController');
const auth = require('../middleware/auth');

router.get('/search', auth, searchFiles);
router.post('/upload-url', auth, getSignedUploadUrl);
router.post('/upload', auth, saveFileMetadata);
router.get('/:id/download', auth, downloadFile);
router.delete('/:id', auth, deleteFile);

module.exports = router;
