const express = require("express");
const router = express.Router();
const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
  toggleStar,
  getCategories,
} = require("../controllers/noteController");

// Replace `protect` with your actual auth middleware import, e.g.:
// const { protect } = require("../middleware/authMiddleware");
const { protect } = require("../middleware/authMiddleware");

router.use(protect); // all note routes are protected

router.route("/").get(getNotes).post(createNote);
router.get("/categories", getCategories);
router.route("/:id").get(getNoteById).put(updateNote).delete(deleteNote);
router.patch("/:id/pin", togglePin);
router.patch("/:id/star", toggleStar);

module.exports = router;
