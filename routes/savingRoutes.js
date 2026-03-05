const { protect } = require('../middleware/auth');
// routes/savingRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/savingController');

router.get('/', protect, ctrl.getAllSavings);
router.get('/:id', protect, ctrl.getSaving);
router.post('/', protect, ctrl.createSaving);
router.put('/:id', protect, ctrl.updateSaving);
router.delete('/:id', protect, ctrl.deleteSaving);

module.exports = router;
