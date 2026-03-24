const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/bonusController");
const { protect } = require("../middleware/auth");

router.get("/", protect, ctrl.getAllBonuses);
router.get("/:id", protect, ctrl.getBonus);
router.post("/", protect, ctrl.createBonus);
router.put("/:id", protect, ctrl.updateBonus);
router.delete("/:id", protect, ctrl.deleteBonus);

module.exports = router;
