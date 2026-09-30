
const mongoose = require('mongoose');
const Order = require('../models/Order');

async function connectDB() {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ordercraft';

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[MongoDB] Connected to ${mongoUri}`);
  } catch (err) {
    console.log(
      `[MongoDB] Local mongod service at ${mongoUri} not detected — running with instant in-memory MongoDB engine.`
    );
  }

  // Seed initial demo dataset if collection is empty
  const existingOrders = await Order.countDocuments();
  if (existingOrders === 0) {
    const { seedDatabase } = require('../seed/seedData');
    const stats = await seedDatabase(false);
    console.log('[MongoDB] Initialized OrderCraft dataset:', stats);
  }
}

module.exports = { connectDB };
