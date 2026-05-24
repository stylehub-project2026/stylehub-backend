const express = require('express');
const router = express.Router();
const { generateOutfitImage } = require('../controllers/aiController');

router.post('/generate-outfit', generateOutfitImage);

module.exports = router;
