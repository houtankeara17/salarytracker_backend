const Bonus = require("../models/Bonus");

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

// Get all bonuses
exports.getAllBonuses = async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.year) filter.year = Number(req.query.year);
    if (req.query.bonusType) filter.bonusType = req.query.bonusType;
    const data = await Bonus.find(filter).sort({ year: -1, monthNumber: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single bonus
exports.getBonus = async (req, res) => {
  try {
    const item = await Bonus.findOne({
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

// Create bonus
exports.createBonus = async (req, res) => {
  try {
    const {
      month,
      year,
      amount,
      currency,
      exchangeRate,
      bonusType = "Performance",
    } = req.body;
    const monthNumber = MONTHS.indexOf(month) + 1;

    if (!monthNumber) {
      return res.status(400).json({ success: false, message: "Invalid month" });
    }

    // Check for duplicate (same month/year/type)
    const existing = await Bonus.findOne({
      userId: req.user.id,
      monthNumber,
      year,
      bonusType,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A ${bonusType} bonus already exists for this month`,
      });
    }

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

    const bonus = await Bonus.create({
      ...req.body,
      userId: req.user.id,
      monthNumber,
      amountUSD,
      amountKHR,
    });

    res.status(201).json({ success: true, data: bonus });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A bonus of this type already exists for this month",
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update bonus
exports.updateBonus = async (req, res) => {
  try {
    if (req.body.month)
      req.body.monthNumber = MONTHS.indexOf(req.body.month) + 1;

    // Recalculate currency amounts on update
    if (req.body.amount || req.body.currency || req.body.exchangeRate) {
      const item = await Bonus.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });
      if (item) {
        const amount = req.body.amount ?? item.amount;
        const currency = req.body.currency ?? item.currency;
        const rate = req.body.exchangeRate ?? item.exchangeRate ?? 4100;
        if (currency === "USD") {
          req.body.amountUSD = amount;
          req.body.amountKHR = amount * rate;
        } else {
          req.body.amountKHR = amount;
          req.body.amountUSD = amount / rate;
        }
      }
    }

    const item = await Bonus.findOneAndUpdate(
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
        message: "A bonus of this type already exists for this month",
      });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete bonus
exports.deleteBonus = async (req, res) => {
  try {
    const item = await Bonus.findOneAndDelete({
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
