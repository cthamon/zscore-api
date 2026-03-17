
const express = require('express');
const router = express.Router();
const zscoreController = require('../controllers/zscoreController');

// Route: /zscore/:code
router.get('/zscore/:ticker', zscoreController.getZscore);
router.post('/line-webhook', zscoreController.webhook);

module.exports = router;