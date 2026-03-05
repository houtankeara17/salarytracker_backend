const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    month: {
      type: String,
      required: true,
      enum: [
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
      ],
    },

    monthNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      enum: ["USD", "KHR"],
      default: "USD",
    },

    amountUSD: Number,
    amountKHR: Number,

    exchangeRate: {
      type: Number,
      default: 4100,
    },

    noted: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// ✅ Only one salary per user per month/year
salarySchema.index({ userId: 1, monthNumber: 1, year: 1 }, { unique: true });

// Auto currency conversion
salarySchema.pre("save", function (next) {
  const rate = this.exchangeRate || 4100;

  if (this.currency === "USD") {
    this.amountUSD = this.amount;
    this.amountKHR = this.amount * rate;
  } else {
    this.amountKHR = this.amount;
    this.amountUSD = this.amount / rate;
  }

  next();
});

module.exports = mongoose.model("Salary", salarySchema);
