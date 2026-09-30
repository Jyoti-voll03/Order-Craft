const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema(
  {
    productionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    orderId: {
      type: String,
      required: [true, 'Related Order ID is required'],
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
    startDate: {
      type: String,
      required: [true, 'Start date is required'],
    },
    expectedCompletionDate: {
      type: String,
      required: [true, 'Expected completion date is required'],
    },
    supervisor: {
      type: String,
      required: [true, 'Assigned supervisor is required'],
      trim: true,
    },
    workCenter: {
      type: String,
      default: '5-Axis CNC Bay A',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: [
        'Scheduled',
        'In Progress',
        'Completed',
        'On Hold',
        'Cancelled',
        'Quality Check',
        'Paused',
      ],
      default: 'Scheduled',
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be less than 0'],
      max: [100, 'Progress cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret.productionId;
        ret.expectedCompletion = ret.expectedCompletionDate;
        return ret;
      },
    },
  }
);

// Automatically set status to Completed when progress reaches 100%
productionSchema.pre('save', function (next) {
  if (this.progress >= 100) {
    this.progress = 100;
    this.status = 'Completed';
  }
  next();
});

const { createHybridModel } = require('../utils/inMemoryStore');

const ProductionModel = mongoose.model('Production', productionSchema);

module.exports = createHybridModel(ProductionModel, 'production', {
  beforeSave: async (doc) => {
    if (Number(doc.progress) >= 100) {
      doc.progress = 100;
      doc.status = 'Completed';
    }
  },
  transform: (_doc, ret) => {
    ret.id = ret.productionId;
    ret.expectedCompletion = ret.expectedCompletionDate;
    return ret;
  },
});
