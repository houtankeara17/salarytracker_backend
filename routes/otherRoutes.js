const { protect } = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const createCrud = require('../controllers/crudController');
const Other = require('../models/Other');
const ctrl = createCrud(Other, 'Other');

router.get('/', protect, ctrl.getAll);
router.get('/:id', protect, ctrl.getOne);
router.post('/', protect, ctrl.create);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.delete);

module.exports = router;
