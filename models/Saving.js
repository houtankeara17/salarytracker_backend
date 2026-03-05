const mongoose = require('mongoose');
const savingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true, trim: true },
  monthNumber: { type: Number, min: 1, max: 12 },
  year: { type: Number, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD', enum: ['USD', 'KHR'] },
  amountUSD: { type: Number },
  amountKHR: { type: Number },
  exchangeRate: { type: Number, default: 4100 },
  noted: { type: String, default: '' }
}, { timestamps: true });
savingSchema.pre('save', function (next) {
  const rate = this.exchangeRate || 4100;
  if (this.currency === 'USD') { this.amountUSD = this.amount; this.amountKHR = this.amount * rate; }
  else { this.amountKHR = this.amount; this.amountUSD = this.amount / rate; }
  next();
});
module.exports = mongoose.model('Saving', savingSchema);
