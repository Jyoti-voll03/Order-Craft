const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    industry: {
      type: String,
      default: 'Industrial Manufacturing',
      trim: true,
    },
    baseOrders: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret.customerId;
        ret.name = ret.customerName;
        ret.company = ret.companyName;
        return ret;
      },
    },
  }
);

const { createHybridModel } = require('../utils/inMemoryStore');

const CustomerModel = mongoose.model('Customer', customerSchema);

module.exports = createHybridModel(CustomerModel, 'customers', {
  transform: (_doc, ret) => {
    ret.id = ret.customerId;
    ret.name = ret.customerName;
    ret.company = ret.companyName;
    return ret;
  },
});
