const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(
  cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "PATCH"] }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/salaries", require("./routes/salaryRoutes"));
app.use("/api/savings", require("./routes/savingRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/trips", require("./routes/tripRoutes"));
app.use("/api/goals", require("./routes/goalRoutes"));
app.use("/api/givings", require("./routes/givingRoutes"));
app.use("/api/others", require("./routes/otherRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/notes", require("./routes/noteRoutes"));

app.get("/api/health", (req, res) =>
  res.json({
    status: "OK",
    message: "MoneyTrack API running",
    timestamp: new Date(),
  }),
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ success: false, message: err.message || "Server Error" });
});
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);

const PORT = process.env.PORT || 5001;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://houtankeara017_db_user:vtps3cBgKt0A5Cu4@salaryapp.cytlii8.mongodb.net/?appName=salaryapp";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

module.exports = app;
