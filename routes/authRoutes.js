// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, updateMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login',    login);
router.post('/logout',   protect, logout);
router.get('/me',        protect, getMe);
router.put('/me',        protect, updateMe);
router.put('/password',  protect, changePassword);

module.exports = router;
