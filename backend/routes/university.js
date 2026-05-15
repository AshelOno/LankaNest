const express = require("express");
const { getAllUniversities } = require("../controllers/universityController");

const router = express.Router();

router.get("/all-universities", getAllUniversities);

module.exports = router;
