// controllers/dashboardController.js
const Expense = require("../models/Expense");
const Salary = require("../models/Salary");
const Saving = require("../models/Saving");
const Trip = require("../models/Trip");
const Goal = require("../models/Goal");
const Giving = require("../models/Giving");
const Other = require("../models/Other");
const mongoose = require("mongoose");

const MONTHS = [
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
];

exports.getSummary = async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();

    // ── Use month/year from query params, fallback to current ──
    const year = parseInt(req.query.year) || now.getFullYear();
    const monthNum = parseInt(req.query.month) || now.getMonth() + 1; // 1-based
    const monthName = MONTHS[monthNum - 1];

    // ── Salary & Saving for the requested month ────────────────
    const salary = await Salary.findOne({
      userId: uid,
      year,
      month: monthName,
    });
    const saving = await Saving.findOne({
      userId: uid,
      year,
      month: monthName,
    });

    // If no salary for this month, return early with null data
    if (!salary) {
      return res.json({
        success: true,
        data: {
          salary: null,
          saving: null,
          salaryUSD: 0,
          savingUSD: 0,
          spendableUSD: 0,
          remainingUSD: 0,
          monthlySpentUSD: 0,
          completedDeductionUSD: 0,
          stats: {
            daily: { totalUSD: 0, totalKHR: 0, count: 0 },
            weekly: { totalUSD: 0, totalKHR: 0, count: 0 },
            monthly: { totalUSD: 0, totalKHR: 0, count: 0 },
            yearly: { totalUSD: 0, totalKHR: 0, count: 0 },
          },
          categoryBreakdown: [],
          plans: {
            recentTrips: [],
            recentGoals: [],
            recentGivings: [],
            recentOthers: [],
            completedThisMonth: [],
            stats: {
              trips: { total: 0, completed: 0, ongoing: 0 },
              goals: { total: 0, completed: 0, ongoing: 0 },
              givings: { total: 0, completed: 0, ongoing: 0 },
              others: { total: 0, completed: 0, ongoing: 0 },
            },
          },
        },
      });
    }

    // ── Date ranges based on requested month/year ──────────────
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 1); // first day of next month

    // For daily/weekly we only use these when viewing current month
    const isCurrentMonth =
      year === now.getFullYear() && monthNum === now.getMonth() + 1;
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    // Daily & weekly only make sense for current month
    const dailyRange = isCurrentMonth
      ? { $gte: todayStart, $lt: todayEnd }
      : { $gte: monthStart, $lt: new Date(monthStart.getTime() + 86400000) };
    const weeklyRange = isCurrentMonth
      ? { $gte: weekStart, $lt: todayEnd }
      : { $gte: monthStart, $lt: monthEnd };

    const [daily, weekly, monthly, yearly] = await Promise.all([
      Expense.aggregate([
        { $match: { userId: uid, date: dailyRange } },
        {
          $group: {
            _id: null,
            totalUSD: { $sum: "$amountUSD" },
            totalKHR: { $sum: "$amountKHR" },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { userId: uid, date: weeklyRange } },
        {
          $group: {
            _id: null,
            totalUSD: { $sum: "$amountUSD" },
            totalKHR: { $sum: "$amountKHR" },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { userId: uid, date: { $gte: monthStart, $lt: monthEnd } } },
        {
          $group: {
            _id: null,
            totalUSD: { $sum: "$amountUSD" },
            totalKHR: { $sum: "$amountKHR" },
            count: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { userId: uid, date: { $gte: yearStart, $lt: yearEnd } } },
        {
          $group: {
            _id: null,
            totalUSD: { $sum: "$amountUSD" },
            totalKHR: { $sum: "$amountKHR" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const categoryBreakdown = await Expense.aggregate([
      { $match: { userId: uid, date: { $gte: monthStart, $lt: monthEnd } } },
      {
        $group: {
          _id: "$category",
          totalUSD: { $sum: "$amountUSD" },
          count: { $sum: 1 },
          emoji: { $first: "$categoryEmoji" },
        },
      },
      { $sort: { totalUSD: -1 } },
    ]);

    // ── Plans ──────────────────────────────────────────────────
    const [trips, goals, givings, others] = await Promise.all([
      Trip.find({ userId: uid }).sort({ createdAt: -1 }).limit(5),
      Goal.find({ userId: uid }).sort({ createdAt: -1 }).limit(5),
      Giving.find({ userId: uid }).sort({ createdAt: -1 }).limit(5),
      Other.find({ userId: uid }).sort({ createdAt: -1 }).limit(5),
    ]);

    // Completed this specific requested month
    const completedThisMonth = [
      ...trips.filter(
        (t) =>
          t.status === "completed" &&
          t.completedAt &&
          t.completedAt >= monthStart &&
          t.completedAt < monthEnd,
      ),
      ...goals.filter(
        (g) =>
          g.status === "completed" &&
          g.completedAt &&
          g.completedAt >= monthStart &&
          g.completedAt < monthEnd,
      ),
      ...givings.filter(
        (g) =>
          g.status === "completed" &&
          g.completedAt &&
          g.completedAt >= monthStart &&
          g.completedAt < monthEnd,
      ),
      ...others.filter(
        (o) =>
          o.status === "completed" &&
          o.completedAt &&
          o.completedAt >= monthStart &&
          o.completedAt < monthEnd,
      ),
    ];
    const completedDeductionUSD = completedThisMonth.reduce(
      (s, i) => s + (i.amountUSD || 0),
      0,
    );

    const salaryUSD = salary?.amountUSD || 0;
    const savingUSD = saving?.amountUSD || 0;
    const spendableUSD = salaryUSD - savingUSD;
    const monthlySpentUSD = monthly[0]?.totalUSD || 0;
    const remainingUSD = spendableUSD - monthlySpentUSD - completedDeductionUSD;

    const [tripStats, goalStats, givingStats, otherStats] = await Promise.all([
      Promise.all([
        Trip.countDocuments({ userId: uid }),
        Trip.countDocuments({ userId: uid, status: "completed" }),
        Trip.countDocuments({ userId: uid, status: "ongoing" }),
      ]).then(([total, completed, ongoing]) => ({ total, completed, ongoing })),
      Promise.all([
        Goal.countDocuments({ userId: uid }),
        Goal.countDocuments({ userId: uid, status: "completed" }),
        Goal.countDocuments({ userId: uid, status: "ongoing" }),
      ]).then(([total, completed, ongoing]) => ({ total, completed, ongoing })),
      Promise.all([
        Giving.countDocuments({ userId: uid }),
        Giving.countDocuments({ userId: uid, status: "completed" }),
        Giving.countDocuments({ userId: uid, status: "ongoing" }),
      ]).then(([total, completed, ongoing]) => ({ total, completed, ongoing })),
      Promise.all([
        Other.countDocuments({ userId: uid }),
        Other.countDocuments({ userId: uid, status: "completed" }),
        Other.countDocuments({ userId: uid, status: "ongoing" }),
      ]).then(([total, completed, ongoing]) => ({ total, completed, ongoing })),
    ]);

    res.json({
      success: true,
      data: {
        salary,
        saving,
        salaryUSD,
        savingUSD,
        spendableUSD,
        remainingUSD,
        monthlySpentUSD,
        completedDeductionUSD,
        stats: {
          daily: daily[0] || { totalUSD: 0, totalKHR: 0, count: 0 },
          weekly: weekly[0] || { totalUSD: 0, totalKHR: 0, count: 0 },
          monthly: monthly[0] || { totalUSD: 0, totalKHR: 0, count: 0 },
          yearly: yearly[0] || { totalUSD: 0, totalKHR: 0, count: 0 },
        },
        categoryBreakdown,
        plans: {
          recentTrips: trips,
          recentGoals: goals,
          recentGivings: givings,
          recentOthers: others,
          completedThisMonth,
          stats: {
            trips: tripStats,
            goals: goalStats,
            givings: givingStats,
            others: otherStats,
          },
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
