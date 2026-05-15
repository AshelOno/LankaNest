const express = require("express");
const router = express.Router();

const {
  addBookMark,
  getBookMark,
  getBookmarksByUser,
  deleteBookmark, // Add the delete function
} = require("../controllers/bookMarkController");
const { verifyToken } = require("../middleware/verifyToken");
const { requireSelfParam } = require("../middleware/authorize");

router.post("/addBookMark", verifyToken, addBookMark);

router.get("/getBookMark", verifyToken, getBookMark);

// Route to fetch bookmarks for a specific user
router.get("/:userId", verifyToken, requireSelfParam("userId"), getBookmarksByUser);

// Route to delete a specific bookmark
router.delete("/:bookmarkId", verifyToken, deleteBookmark);

// Export the router
module.exports = router;
