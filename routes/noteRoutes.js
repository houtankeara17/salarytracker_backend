const express = require("express");
const router = express.Router();
const {
  getNotes,
  getNote,
  createNote,
  updateNote,
  togglePin,
  deleteNote,
} = require("../controllers/noteController");
const { protect } = require("../middleware/auth");

router.use(protect); // all routes require login

router
  .route("/")
  .get(getNotes) // GET  /api/notes
  .post(createNote); // POST /api/notes

router
  .route("/:id")
  .get(getNote) // GET    /api/notes/:id
  .put(updateNote) // PUT    /api/notes/:id
  .delete(deleteNote); // DELETE /api/notes/:id

router.patch("/:id/pin", togglePin); // PATCH /api/notes/:id/pin

module.exports = router;
