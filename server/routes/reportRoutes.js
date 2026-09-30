const express = require('express');
const { getReportsData } = require('../controllers/reportController');

const router = express.Router();

router.get('/', getReportsData);

module.exports = router;
