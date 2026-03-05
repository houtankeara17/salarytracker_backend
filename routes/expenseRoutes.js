const { protect } = require('../middleware/auth');
// routes/expenseRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expenseController');

router.get('/stats', protect, ctrl.getDashboardStats);
router.get('/', protect, ctrl.getAllExpenses);
router.get('/:id', protect, ctrl.getExpense);
router.post('/', protect, ctrl.createExpense);
router.put('/:id', protect, ctrl.updateExpense);
router.delete('/:id', protect, ctrl.deleteExpense);

module.exports = router;
