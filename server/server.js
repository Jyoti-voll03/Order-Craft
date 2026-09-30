const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productionRoutes = require('./routes/productionRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const demoRoutes = require('./routes/demoRoutes');

const app = express();

// Security & Permissive CORS for all localhost / VS Code dev ports (5173, 5174, 5177, etc.)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan('dev'));

// Ensure database is initialized
let dbInitPromise = null;
function ensureDB() {
  if (!dbInitPromise) {
    dbInitPromise = connectDB().catch((err) => {
      console.error('Database init error:', err);
    });
  }
  return dbInitPromise;
}

app.use(async (_req, _res, next) => {
  await ensureDB();
  next();
});

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'OrderCraft Manufacturing Backend API is running',
    data: {
      status: 'online',
      timestamp: new Date().toISOString(),
    },
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/demo', demoRoutes);

// Only run standalone listener & static serving when executed directly
if (require.main === module) {
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.use(notFound);
  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;
  ensureDB().then(() => {
    const server = app.listen(PORT, () => {
      console.log(`========================================================`);
      console.log(` OrderCraft Backend Server running on port ${PORT}`);
      console.log(` API Base URL: http://localhost:${PORT}/api`);
      console.log(`========================================================`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[OrderCraft] Port ${PORT} is already active.`);
      } else {
        console.error(err);
      }
    });
  });
}

module.exports = app;
