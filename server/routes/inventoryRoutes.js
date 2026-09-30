const express = require('express');
const {
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(getInventory).post(protect, createInventoryItem);

router
  .route('/:id')
  .get(getInventoryById)
  .put(protect, updateInventoryItem)
  .delete(protect, deleteInventoryItem);

module.exports = router;
