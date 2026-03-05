const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/salaryController");
const { protect } = require("../middleware/auth");

router.get("/", protect, ctrl.getAllSalaries);
router.get("/:id", protect, ctrl.getSalary);
router.post("/", protect, ctrl.createSalary);
router.put("/:id", protect, ctrl.updateSalary);
router.delete("/:id", protect, ctrl.deleteSalary);

module.exports = router;
