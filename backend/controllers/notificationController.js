const asyncHandler = require('express-async-handler');
const { findNotificationsByUserId, markAsRead } = require('../models/notificationModel');

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await findNotificationsByUserId(req.user.id);
  res.status(200).json({
    success: true,
    data: notifications,
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
const readNotification = asyncHandler(async (req, res) => {
  await markAsRead(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Notification updated',
  });
});

module.exports = {
  getMyNotifications,
  readNotification,
};
