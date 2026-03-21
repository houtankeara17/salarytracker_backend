const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemName: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        "food",
        "drink",
        "fruit",
        "transport",
        "clothing",
        "health",
        "entertainment",
        "education",
        "utilities",
        "shopping",
        "other",
      ],
    },
    categoryEmoji: { type: String, default: "💸" },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    date: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", enum: ["USD", "KHR"] },
    amountUSD: { type: Number },
    amountKHR: { type: Number },
    exchangeRate: { type: Number, default: 4100 },
    noted: { type: String, default: "" },
    // QR payment screenshot
    imageQr: { type: String, default: null },
    // General expense receipt / product image (Cloudinary URL)
    imageUrl: { type: String, default: null },
    paymentMethod: {
      type: String,
      enum: ["cash", "qr", "card", "transfer"],
      default: "cash",
    },
  },
  { timestamps: true },
);

expenseSchema.pre("save", function (next) {
  const rate = this.exchangeRate || 4100;
  if (this.currency === "USD") {
    this.amountUSD = this.amount;
    this.amountKHR = this.amount * rate;
  } else {
    this.amountKHR = this.amount;
    this.amountUSD = this.amount / rate;
  }
  const emojiMap = {
    food: "🍚",
    drink: "☕",
    fruit: "🍓",
    transport: "🚗",
    clothing: "👕",
    health: "💊",
    entertainment: "🎮",
    education: "📚",
    utilities: "💡",
    shopping: "🛍️",
    other: "💸",
  };
  this.categoryEmoji = emojiMap[this.category] || "💸";
  next();
});

// Also recalculate on findOneAndUpdate
expenseSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (
    update.amount !== undefined ||
    update.currency !== undefined ||
    update.exchangeRate !== undefined
  ) {
    const rate = update.exchangeRate || 4100;
    const currency = update.currency || "USD";
    const amount = update.amount;
    if (amount !== undefined) {
      if (currency === "USD") {
        update.amountUSD = amount;
        update.amountKHR = amount * rate;
      } else {
        update.amountKHR = amount;
        update.amountUSD = amount / rate;
      }
    }
  }
  next();
});

module.exports = mongoose.model("Expense", expenseSchema);
