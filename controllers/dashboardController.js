// controllers/dashboardController.js
const Expense = require('../models/Expense');
const Salary  = require('../models/Salary');
const Saving  = require('../models/Saving');
const Trip    = require('../models/Trip');
const Goal    = require('../models/Goal');
const Giving  = require('../models/Giving');
const Other   = require('../models/Other');
const mongoose = require('mongoose');

exports.getSummary = async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const year = now.getFullYear();
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const currentMonthName = MONTHS[now.getMonth()];

    const salary = await Salary.findOne({ userId: uid, year, month: currentMonthName });
    const saving = await Saving.findOne({ userId: uid, year, month: currentMonthName });

    const todayStart = new Date(year, now.getMonth(), now.getDate());
    const todayEnd   = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
    const weekStart  = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(year, now.getMonth(), 1);
    const yearStart  = new Date(year, 0, 1);

    const [daily, weekly, monthly, yearly] = await Promise.all([
      Expense.aggregate([{ $match:{ userId: uid, date:{$gte:todayStart,$lt:todayEnd}}},{ $group:{ _id:null, totalUSD:{$sum:'$amountUSD'}, totalKHR:{$sum:'$amountKHR'}, count:{$sum:1}}}]),
      Expense.aggregate([{ $match:{ userId: uid, date:{$gte:weekStart,$lt:todayEnd}}},{ $group:{ _id:null, totalUSD:{$sum:'$amountUSD'}, totalKHR:{$sum:'$amountKHR'}, count:{$sum:1}}}]),
      Expense.aggregate([{ $match:{ userId: uid, date:{$gte:monthStart,$lt:todayEnd}}},{ $group:{ _id:null, totalUSD:{$sum:'$amountUSD'}, totalKHR:{$sum:'$amountKHR'}, count:{$sum:1}}}]),
      Expense.aggregate([{ $match:{ userId: uid, date:{$gte:yearStart,$lt:todayEnd}}},{ $group:{ _id:null, totalUSD:{$sum:'$amountUSD'}, totalKHR:{$sum:'$amountKHR'}, count:{$sum:1}}}]),
    ]);

    const categoryBreakdown = await Expense.aggregate([
      { $match:{ userId: uid, date:{$gte:monthStart,$lt:todayEnd}}},
      { $group:{ _id:'$category', totalUSD:{$sum:'$amountUSD'}, count:{$sum:1}, emoji:{$first:'$categoryEmoji'}}},
      { $sort:{ totalUSD:-1 }}
    ]);

    // ── Plans summary ──────────────────────────────────────────
    const [trips, goals, givings, others] = await Promise.all([
      Trip.find({ userId: uid }).sort({ createdAt: -1 }).limit(5),
      Goal.find({ userId: uid }).sort({ createdAt: -1 }).limit(5),
      Giving.find({ userId: uid }).sort({ createdAt: -1 }).limit(5),
      Other.find({ userId: uid }).sort({ createdAt: -1 }).limit(5),
    ]);

    // ── Completed items this month: deduct from remaining ──────
    // When a trip/goal/giving/other is completed this month, it counts
    // as an expense deducted from the spendable amount
    const completedThisMonth = [
      ...trips.filter(t => t.status === 'completed' && t.completedAt && t.completedAt >= monthStart),
      ...goals.filter(g => g.status === 'completed' && g.completedAt && g.completedAt >= monthStart),
      ...givings.filter(g => g.status === 'completed' && g.completedAt && g.completedAt >= monthStart),
      ...others.filter(o => o.status === 'completed' && o.completedAt && o.completedAt >= monthStart),
    ];
    const completedDeductionUSD = completedThisMonth.reduce((s, i) => s + (i.amountUSD || 0), 0);

    const salaryUSD   = salary?.amountUSD || 0;
    const savingUSD   = saving?.amountUSD || 0;
    const spendableUSD = salaryUSD - savingUSD;
    const monthlySpentUSD = monthly[0]?.totalUSD || 0;
    // remaining = spendable - regular expenses - completed plan amounts
    const remainingUSD = spendableUSD - monthlySpentUSD - completedDeductionUSD;

    // Plan stats
    const tripStats   = { total: await Trip.countDocuments({ userId: uid }), completed: await Trip.countDocuments({ userId: uid, status:'completed'}), ongoing: await Trip.countDocuments({ userId: uid, status:'ongoing'}) };
    const goalStats   = { total: await Goal.countDocuments({ userId: uid }), completed: await Goal.countDocuments({ userId: uid, status:'completed'}), ongoing: await Goal.countDocuments({ userId: uid, status:'ongoing'}) };
    const givingStats = { total: await Giving.countDocuments({ userId: uid }), completed: await Giving.countDocuments({ userId: uid, status:'completed'}), ongoing: await Giving.countDocuments({ userId: uid, status:'ongoing'}) };
    const otherStats  = { total: await Other.countDocuments({ userId: uid }), completed: await Other.countDocuments({ userId: uid, status:'completed'}), ongoing: await Other.countDocuments({ userId: uid, status:'ongoing'}) };

    res.json({
      success: true,
      data: {
        salary, saving,
        salaryUSD, savingUSD, spendableUSD, remainingUSD,
        monthlySpentUSD, completedDeductionUSD,
        stats: {
          daily:   daily[0]   || { totalUSD:0, totalKHR:0, count:0 },
          weekly:  weekly[0]  || { totalUSD:0, totalKHR:0, count:0 },
          monthly: monthly[0] || { totalUSD:0, totalKHR:0, count:0 },
          yearly:  yearly[0]  || { totalUSD:0, totalKHR:0, count:0 },
        },
        categoryBreakdown,
        plans: {
          recentTrips: trips, recentGoals: goals, recentGivings: givings, recentOthers: others,
          completedThisMonth,
          stats: { trips: tripStats, goals: goalStats, givings: givingStats, others: otherStats }
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
