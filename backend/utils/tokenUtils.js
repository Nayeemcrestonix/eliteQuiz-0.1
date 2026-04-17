const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Generate a JWT token
 * @param {string|number} id - User ID
 * @returns {string} - Signed JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  });
};

module.exports = {
  generateToken,
};
