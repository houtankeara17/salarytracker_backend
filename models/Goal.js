const mongoose = require('mongoose');
const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  targetAmount: { type: Number, required: true, min: 0 },
  savedAmount: { type: Number, default: 0 },
  currency: { type: String, default: 'USD', enum: ['USD', 'KHR'] },
  exchangeRate: { type: Number, default: 4100 },
  amountUSD: { type: Number, default: 0 },
  targetDate: { type: Date },
  completedAt: { type: Date },
  status: { type: String, enum: ['planned','ongoing','completed','cancelled'], default: 'planned' },
  noted: { type: String, default: '' }
}, { timestamps: true });
goalSchema.pre('save', function(next) {
  const rate = this.exchangeRate || 4100;
  const saved = this.savedAmount || 0;
  this.amountUSD = this.currency === 'KHR' ? saved / rate : saved;
  if (this.status === 'completed' && !this.completedAt) this.completedAt = new Date();
  next();
});
module.exports = mongoose.model('Goal', goalSchema);
