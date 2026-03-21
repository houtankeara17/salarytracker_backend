const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: "" },
});

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, default: "" },
    content: { type: String, required: true, trim: true },
    color: {
      type: String,
      default: "yellow",
      enum: ["yellow", "blue", "green", "pink", "purple", "white"],
    },
    pinned: { type: Boolean, default: false },
    images: { type: [imageSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Note", noteSchema);
