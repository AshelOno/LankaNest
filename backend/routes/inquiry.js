const express = require("express");
const router = express.Router();
const { sendInquiry } = require("../controllers/addInquiryController");

router.post("/add-inquiry", sendInquiry);

module.exports = router;