const mongoose = require("mongoose");
const givingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    recipient: { type: String, default: "" },
    targetAmount: { type: Number, required: true, min: 0 },
    givenAmount: { type: Number, default: 0 },
    currency: { type: String, default: "USD", enum: ["USD", "KHR"] },
    exchangeRate: { type: Number, default: 4100 },
    amountUSD: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    completedAt: { type: Date },
    status: {
      type: String,
      enum: ["planned", "ongoing", "completed"],
      default: "planned",
    },
    noted: { type: String, default: "" },
  },
  { timestamps: true },
);
givingSchema.pre("save", function (next) {
  const rate = this.exchangeRate || 4100;
  const given = this.givenAmount || 0;
  this.amountUSD = this.currency === "KHR" ? given / rate : given;
  if (this.status === "completed" && !this.completedAt)
    this.completedAt = new Date();
  next();
});
module.exports = mongoose.model("Giving", givingSchema);
