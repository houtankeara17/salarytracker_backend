const mongoose = require('mongoose');
const otherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  targetAmount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0 },
  currency: { type: String, default: 'USD', enum: ['USD', 'KHR'] },
  exchangeRate: { type: Number, default: 4100 },
  amountUSD: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  completedAt: { type: Date },
  status: { type: String, enum: ['ongoing','completed'], default: 'ongoing' },
  noted: { type: String, default: '' }
}, { timestamps: true });
otherSchema.pre('save', function(next) {
  const rate = this.exchangeRate || 4100;
  const paid = this.paidAmount || 0;
  this.amountUSD = this.currency === 'KHR' ? paid / rate : paid;
  if (this.status === 'completed' && !this.completedAt) this.completedAt = new Date();
  next();
});
module.exports = mongoose.model('Other', otherSchema);
