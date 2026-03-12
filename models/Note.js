const mongoose = require("mongoose");

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
  },
  { timestamps: true },
);

module.exports = mongoose.model("Note", noteSchema);
