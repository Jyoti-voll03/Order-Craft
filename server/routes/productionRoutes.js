const express = require('express');
const { body } = require('express-validator');
const {
  getProduction,
  getProductionById,
  createProduction,
  updateProduction,
  updateProductionProgress,
  updateProductionStatus,
  deleteProduction,
} = require('../controllers/productionController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router
  .route('/')
  .get(getProduction)
  .post(
    protect,
    [
      body('productName').notEmpty().withMessage('Product name is required'),
      body('supervisor').notEmpty().withMessage('Assigned supervisor is required'),
      body('quantity')
        .isNumeric()
        .withMessage('Quantity must be a valid number'),
      validateRequest,
    ],
    createProduction
  );

router.patch('/:id/progress', protect, updateProductionProgress);
router.patch('/:id/status', protect, updateProductionStatus);

router
  .route('/:id')
  .get(getProductionById)
  .put(protect, updateProduction)
  .delete(protect, deleteProduction);

module.exports = router;
