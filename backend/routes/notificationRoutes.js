const express = require('express');
const router = express.Router();
const { getMyNotifications, readNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, readNotification);

module.exports = router;
