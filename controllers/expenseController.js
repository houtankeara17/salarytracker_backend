const Expense = require("../models/Expense");
const cloudinary = require("cloudinary").v2;

// Cloudinary is configured via env vars automatically if you set:
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// OR call cloudinary.config() explicitly:
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ── Helper: upload a base64 data URI to Cloudinary ── */
const uploadToCloudinary = async (dataUri, folder = "expenses") => {
  if (!dataUri || !dataUri.startsWith("data:")) return null;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
  return result.secure_url;
};

/* ── Helper: delete a Cloudinary image by URL ── */
const deleteFromCloudinary = async (url) => {
  if (!url || !url.includes("cloudinary")) return;
  try {
    // Extract public_id from URL  e.g. expenses/abc123
    const parts = url.split("/");
    const filename = parts[parts.length - 1].split(".")[0];
    const folder = parts[parts.length - 2];
    await cloudinary.uploader.destroy(`${folder}/${filename}`);
  } catch (_) {
    /* silent — not critical */
  }
};

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
    const body = { ...req.body, userId: req.user.id };

    // Upload imageQr if it's a base64 data URI
    if (body.imageQr && body.imageQr.startsWith("data:")) {
      body.imageQr = await uploadToCloudinary(body.imageQr, "expenses/qr");
    }

    // Upload imageUrl if it's a base64 data URI
    if (body.imageUrl && body.imageUrl.startsWith("data:")) {
      body.imageUrl = await uploadToCloudinary(
        body.imageUrl,
        "expenses/images",
      );
    }

    const item = await Expense.create(body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const existing = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!existing)
      return res.status(404).json({ success: false, message: "Not found" });

    const body = { ...req.body };

    // Handle imageQr update
    if (body.imageQr && body.imageQr.startsWith("data:")) {
      // Delete old Cloudinary image if it exists
      if (existing.imageQr) await deleteFromCloudinary(existing.imageQr);
      body.imageQr = await uploadToCloudinary(body.imageQr, "expenses/qr");
    }

    // Handle imageUrl update
    if (body.imageUrl && body.imageUrl.startsWith("data:")) {
      // Delete old Cloudinary image if it exists
      if (existing.imageUrl) await deleteFromCloudinary(existing.imageUrl);
      body.imageUrl = await uploadToCloudinary(
        body.imageUrl,
        "expenses/images",
      );
    }

    // If imageUrl explicitly set to null/empty, delete from Cloudinary
    if (body.imageUrl === "" || body.imageUrl === null) {
      if (existing.imageUrl) await deleteFromCloudinary(existing.imageUrl);
      body.imageUrl = null;
    }

    const item = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      body,
      { new: true, runValidators: true },
    );
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
    // Clean up Cloudinary images
    if (item.imageQr) await deleteFromCloudinary(item.imageQr);
    if (item.imageUrl) await deleteFromCloudinary(item.imageUrl);
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
