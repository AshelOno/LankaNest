const express = require("express");
const router = express.Router();

const { addReport, getReport, resolveReport } = require("../controllers/reportController");
const { verifyToken } = require("../middleware/verifyToken");
const { requireAdmin } = require("../middleware/requireAdmin");

router.post("/addReport", verifyToken, addReport);

router.get("/admin/get-reports", verifyToken, requireAdmin, getReport);
router.post("/resolve/:reportId", verifyToken, requireAdmin, resolveReport);


module.exports = router;
