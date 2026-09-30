const express = require('express');
const {
  getCustomers,
  getCustomerById,
  getCustomerOrders,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getCustomers).post(protect, createCustomer);

router.get('/:id/orders', getCustomerOrders);

router
  .route('/:id')
  .get(getCustomerById)
  .put(protect, updateCustomer)
  .delete(protect, deleteCustomer);

module.exports = router;
