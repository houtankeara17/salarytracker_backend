const Expense = require("../models/Expense");

exports.getAllExpenses = async (req, res) => {
  try {
    const { category, date, startDate, endDate, month, year, paymentMethod } =
      req.query;
    const filter = { userId: req.user.id };
    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }
    const expenses = await Expense.find(filter).sort({ date: -1 });
    const totalUSD = expenses.reduce((s, e) => s + (e.amountUSD || 0), 0);
    const totalKHR = expenses.reduce((s, e) => s + (e.amountKHR || 0), 0);
    res.json({
      success: true,
      count: expenses.length,
      totalUSD,
      totalKHR,
      data: expenses,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.getExpense = async (req, res) => {
  try {
    const item = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!item)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.createExpense = async (req, res) => {
  try {
    const item = await Expense.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
exports.updateExpense = async (req, res) => {
  try {
    const item = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true },
    );
    if (!item)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
exports.deleteExpense = async (req, res) => {
  try {
    const item = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!item)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.getDashboardStats = async (req, res) => {
  try {
    const uid = req.user.id;
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const [daily, weekly, monthly, yearly] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            userId: require("mongoose").Types.ObjectId(uid),
            date: { $gte: todayStart, $lt: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalUSD: { $sum: "$amountUSD" },
            totalKHR: { $sum: "$amountKHR" },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            userId: require("mongoose").Types.ObjectId(uid),
            date: { $gte: weekStart, $lt: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalUSD: { $sum: "$amountUSD" },
            totalKHR: { $sum: "$amountKHR" },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            userId: require("mongoose").Types.ObjectId(uid),
            date: { $gte: monthStart, $lt: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalUSD: { $sum: "$amountUSD" },
            totalKHR: { $sum: "$amountKHR" },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            userId: require("mongoose").Types.ObjectId(uid),
            date: { $gte: yearStart, $lt: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalUSD: { $sum: "$amountUSD" },
            totalKHR: { $sum: "$amountKHR" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);
    res.json({
      success: true,
      data: {
        daily: daily[0] || { totalUSD: 0, totalKHR: 0, count: 0 },
        weekly: weekly[0] || { totalUSD: 0, totalKHR: 0, count: 0 },
        monthly: monthly[0] || { totalUSD: 0, totalKHR: 0, count: 0 },
        yearly: yearly[0] || { totalUSD: 0, totalKHR: 0, count: 0 },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
