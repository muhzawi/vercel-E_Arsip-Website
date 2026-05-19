const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, forgotPassword, resetPassword } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
