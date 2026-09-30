const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: String,
      default: 'CUS-201',
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      default: 'Industrial Partner Pvt Ltd',
      trim: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      default: 150,
      min: [0, 'Unit price cannot be negative'],
    },
    orderDate: {
      type: String,
      required: [true, 'Order date is required'],
    },
    expectedDeliveryDate: {
      type: String,
      required: [true, 'Expected delivery date is required'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'In Production',
        'Completed',
        'Delivered',
        'Cancelled',
      ],
      default: 'Pending',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret.orderId;
        ret.expectedDelivery = ret.expectedDeliveryDate;
        ret.totalValue = (Number(ret.quantity) || 0) * (Number(ret.unitPrice) || 150);
        return ret;
      },
    },
  }
);

const { createHybridModel } = require('../utils/inMemoryStore');

const OrderModel = mongoose.model('Order', orderSchema);

module.exports = createHybridModel(OrderModel, 'orders', {
  transform: (_doc, ret) => {
    ret.id = ret.orderId;
    ret.expectedDelivery = ret.expectedDeliveryDate;
    ret.totalValue = (Number(ret.quantity) || 0) * (Number(ret.unitPrice) || 150);
    return ret;
  },
});
