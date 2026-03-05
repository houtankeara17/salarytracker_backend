const { protect } = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/dashboardController');

router.get('/summary', protect, getSummary);

module.exports = router;
