const express = require('express');
const { resetDemoDatabase } = require('../controllers/demoController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/reset', protect, resetDemoDatabase);

module.exports = router;
