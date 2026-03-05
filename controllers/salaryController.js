const Salary = require("../models/Salary");
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Get all salaries
exports.getAllSalaries = async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.year) filter.year = Number(req.query.year);
    const data = await Salary.find(filter).sort({ year: -1, monthNumber: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single salary
exports.getSalary = async (req, res) => {
  try {
    const item = await Salary.findOne({
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

// Create or Update Salary (Upsert)
exports.createSalary = async (req, res) => {
  try {
    const { month, year, amount, currency, exchangeRate } = req.body;
    const monthNumber = MONTHS.indexOf(month) + 1;

    if (!monthNumber) {
      return res.status(400).json({
        success: false,
        message: "Invalid month",
      });
    }

    // 🔥 Check first
    const existing = await Salary.findOne({
      userId: req.user.id,
      monthNumber,
      year,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Salary already exists for this month",
      });
    }

    // Currency calculation
    const rate = exchangeRate || 4100;
    let amountUSD = 0;
    let amountKHR = 0;

    if (currency === "USD") {
      amountUSD = amount;
      amountKHR = amount * rate;
    } else {
      amountKHR = amount;
      amountUSD = amount / rate;
    }

    const salary = await Salary.create({
      ...req.body,
      userId: req.user.id,
      monthNumber,
      amountUSD,
      amountKHR,
    });

    res.status(201).json({
      success: true,
      data: salary,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update salary
exports.updateSalary = async (req, res) => {
  try {
    if (req.body.month)
      req.body.monthNumber = MONTHS.indexOf(req.body.month) + 1;
    const item = await Salary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true },
    );
    if (!item)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Salary already exists for this month",
      });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete salary
exports.deleteSalary = async (req, res) => {
  try {
    const item = await Salary.findOneAndDelete({
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
