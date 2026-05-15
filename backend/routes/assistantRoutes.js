const express = require("express");
const router = express.Router();
const { softVerifyToken } = require("../middleware/verifyToken");
const assistantController = require("../controllers/assistantController");

router.post("/chat", softVerifyToken, assistantController.chat);

module.exports = router;
