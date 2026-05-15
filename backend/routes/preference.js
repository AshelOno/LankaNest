const express = require('express');
const router = express.Router();
const preferenceController = require('../controllers/preferenceController');
const { verifyToken } = require('../middleware/verifyToken'); // Correct middleware import

router.post('/save', verifyToken, preferenceController.savePreferences);

router.get('/', verifyToken, preferenceController.getPreferences);

module.exports = router;
