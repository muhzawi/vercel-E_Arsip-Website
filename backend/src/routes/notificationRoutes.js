const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.post('/subscribe', auth, subscribe);
router.post('/unsubscribe', auth, unsubscribe);

module.exports = router;
