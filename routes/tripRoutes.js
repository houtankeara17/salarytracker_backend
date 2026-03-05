const { protect } = require('../middleware/auth');
// routes/tripRoutes.js
const express = require('express');
const router = express.Router();
const createCrud = require('../controllers/crudController');
const Trip = require('../models/Trip');
const ctrl = createCrud(Trip, 'Trip');

router.get('/', protect, ctrl.getAll);
router.get('/:id', protect, ctrl.getOne);
router.post('/', protect, ctrl.create);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.delete);

module.exports = router;
