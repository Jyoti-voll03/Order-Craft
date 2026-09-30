const mongoose = require('mongoose');

function computeStockStatus(quantity, minimumStock) {
  const qty = Number(quantity) || 0;
  const min = Number(minimumStock) || 0;
  if (qty === 0) return 'Out of Stock';
  if (qty <= min) return 'Low Stock';
  return 'In Stock';
}

const inventorySchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      default: 'pcs',
      trim: true,
    },
    minimumStock: {
      type: Number,
      required: [true, 'Minimum stock threshold is required'],
      min: [0, 'Minimum stock cannot be negative'],
      default: 10,
    },
    unitCost: {
      type: Number,
      default: 35,
    },
    supplier: {
      type: String,
      required: [true, 'Supplier is required'],
      trim: true,
    },
    location: {
      type: String,
      default: 'Rack A-01',
      trim: true,
    },
    stockStatus: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret.itemId;
        ret.name = ret.itemName;
        ret.availableQuantity = ret.quantity;
        ret.minStockLevel = ret.minimumStock;
        ret.stockStatus = computeStockStatus(ret.quantity, ret.minimumStock);
        return ret;
      },
    },
  }
);

inventorySchema.pre('save', function (next) {
  this.stockStatus = computeStockStatus(this.quantity, this.minimumStock);
  next();
});

const { createHybridModel } = require('../utils/inMemoryStore');

const InventoryModel = mongoose.model('Inventory', inventorySchema);

module.exports = {
  Inventory: createHybridModel(InventoryModel, 'inventory', {
    beforeSave: async (doc) => {
      doc.stockStatus = computeStockStatus(doc.quantity, doc.minimumStock);
    },
    transform: (_doc, ret) => {
      ret.id = ret.itemId;
      ret.name = ret.itemName;
      ret.availableQuantity = ret.quantity;
      ret.minStockLevel = ret.minimumStock;
      ret.stockStatus = computeStockStatus(ret.quantity, ret.minimumStock);
      return ret;
    },
  }),
  computeStockStatus,
};
