const express = require('express');
const { body } = require('express-validator');
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router
  .route('/')
  .get(getOrders)
  .post(
    protect,
    [
      body('customerName').notEmpty().withMessage('Customer name is required'),
      body('productName').notEmpty().withMessage('Product name is required'),
      body('quantity')
        .isNumeric()
        .withMessage('Quantity must be a valid number'),
      validateRequest,
    ],
    createOrder
  );

router
  .route('/:id')
  .get(getOrderById)
  .put(protect, updateOrder)
  .delete(protect, deleteOrder);

module.exports = router;
