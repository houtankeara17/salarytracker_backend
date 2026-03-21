const Note = require("../models/Note");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ── Cloudinary config ─────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "moneytrack-notes",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

exports.upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

// ── Helper: delete images from Cloudinary ─────────────────────
async function deleteImages(images = []) {
  await Promise.allSettled(
    images
      .filter((img) => img.publicId)
      .map((img) => cloudinary.uploader.destroy(img.publicId)),
  );
}

// ── GET all notes ─────────────────────────────────────────────
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({
      pinned: -1,
      updatedAt: -1,
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

    const images = (req.files || []).map((f) => ({
      url: f.path,
      publicId: f.filename,
    }));

    const note = await Note.create({
      user: req.user._id,
      title,
      content,
      color,
      pinned,
      images,
    });
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE note ───────────────────────────────────────────────
exports.updateNote = async (req, res) => {
  try {
    const existing = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });

    // Parse kept images (sent as JSON string or array of ids to keep)
    let keepPublicIds = [];
    if (req.body.keepImages) {
      try {
        keepPublicIds = JSON.parse(req.body.keepImages);
      } catch {
        keepPublicIds = [];
      }
    }

    // Delete images that were removed
    const removed = existing.images.filter(
      (img) => img.publicId && !keepPublicIds.includes(img.publicId),
    );
    await deleteImages(removed);

    const keptImages = existing.images.filter(
      (img) => !img.publicId || keepPublicIds.includes(img.publicId),
    );

    // New uploads
    const newImages = (req.files || []).map((f) => ({
      url: f.path,
      publicId: f.filename,
    }));

    const { title, content, color, pinned } = req.body;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        title,
        content,
        color,
        pinned,
        images: [...keptImages, ...newImages],
      },
      { new: true, runValidators: true },
    );

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

    await deleteImages(note.images);

    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
