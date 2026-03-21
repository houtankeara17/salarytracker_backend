const express = require("express");
const router = express.Router();
const {
  getNotes,
  getNote,
  createNote,
  updateNote,
  togglePin,
  deleteNote,
  upload,
} = require("../controllers/noteController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getNotes).post(upload.array("images", 6), createNote); // up to 6 images

router
  .route("/:id")
  .get(getNote)
  .put(upload.array("images", 6), updateNote)
  .delete(deleteNote);

router.patch("/:id/pin", togglePin);

module.exports = router;
