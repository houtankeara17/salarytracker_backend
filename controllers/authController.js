// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "eddd37f4596a8bda549c721f9607180e2bade34e1efa2ba659c33b481cf448143055f7d1c058da83b42e9e81951c3d496b3e5f2ef27ab00d7cff965841aba719";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

const signToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, language, theme, currency } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });

    const exists = await User.findOne({ email });
    if (exists)
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });

    const user = await User.create({
      name,
      email,
      password,
      language,
      theme,
      currency,
    });
    sendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password)))
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    // Re-fetch without password via toJSON
    const safeUser = await User.findById(user._id);
    sendToken(safeUser, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me  (protected)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/me  (protected) - update profile/preferences
// PUT /api/auth/me
exports.updateMe = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "language",
      "theme",
      "currency",
      "exchangeRate",
      "avatar",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/password  (protected) - change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    if (!(await user.matchPassword(currentPassword)))
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    user.password = newPassword;
    await user.save();
    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/logout  (client just deletes token, but we can confirm)
exports.logout = async (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};
