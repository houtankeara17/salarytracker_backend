const Note = require("../models/Note");

// ── GET all notes for logged-in user ─────────────────────────
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({
      pinned: -1, // pinned first
      updatedAt: -1, // newest first
    });
    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET single note ───────────────────────────────────────────
exports.getNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CREATE note ───────────────────────────────────────────────
exports.createNote = async (req, res) => {
  try {
    const { title, content, color, pinned } = req.body;
    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Content is required" });
    }
    const note = await Note.create({
      user: req.user._id,
      title,
      content,
      color,
      pinned,
    });
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE note ───────────────────────────────────────────────
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true },
    );
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── TOGGLE pin ────────────────────────────────────────────────
exports.togglePin = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    note.pinned = !note.pinned;
    await note.save();
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE note ───────────────────────────────────────────────
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
