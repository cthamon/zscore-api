
const express = require('express');
const router = express.Router();
const zscoreController = require('../controllers/zscoreController');

// Route: /zscore/:code
router.get('/zscore/:ticker', zscoreController.getZscore);

module.exports = router;