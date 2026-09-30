const Order = require('../models/Order');
const Production = require('../models/Production');
const { Inventory } = require('../models/Inventory');
const Customer = require('../models/Customer');

// GET /api/reports
async function getReportsData(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const orderFilter = {};
    if (startDate || endDate) {
      orderFilter.orderDate = {};
      if (startDate) orderFilter.orderDate.$gte = startDate;
      if (endDate) orderFilter.orderDate.$lte = endDate;
    }

    const [orders, production, inventory, customers] = await Promise.all([
      Order.find(orderFilter).sort({ orderDate: -1 }),
      Production.find(),
      Inventory.find(),
      Customer.find(),
    ]);

    const completedOrders = orders.filter(
      (o) => o.status === 'Completed' || o.status === 'Delivered'
    ).length;
    const pendingOrders = orders.filter(
      (o) => o.status === 'Pending' || o.status === 'Confirmed'
    ).length;

    // Production performance by supervisor
    const supMap = {};
    production.forEach((p) => {
      if (!supMap[p.supervisor]) {
        supMap[p.supervisor] = {
          supervisor: p.supervisor,
          totalBatches: 0,
          totalUnits: 0,
          progressSum: 0,
        };
      }
      supMap[p.supervisor].totalBatches += 1;
      supMap[p.supervisor].totalUnits += Number(p.quantity) || 0;
      supMap[p.supervisor].progressSum += Number(p.progress) || 0;
    });
    const productionPerformance = Object.values(supMap).map((s) => ({
      ...s,
      avgProgress: Math.round(s.progressSum / Math.max(1, s.totalBatches)),
    }));

    // Inventory summary by category
    const catMap = {};
    inventory.forEach((i) => {
      if (!catMap[i.category]) {
        catMap[i.category] = {
          category: i.category,
          skuCount: 0,
          totalQuantity: 0,
          lowStockCount: 0,
        };
      }
      catMap[i.category].skuCount += 1;
      catMap[i.category].totalQuantity += Number(i.quantity) || 0;
      if (i.stockStatus !== 'In Stock') catMap[i.category].lowStockCount += 1;
    });
    const inventorySummary = Object.values(catMap);

    // Customer order statistics
    const customerOrderStatistics = customers.map((c) => {
      const matching = orders.filter(
        (o) =>
          o.customerId === c.customerId ||
          (o.customerName &&
            o.customerName.toLowerCase() === c.customerName.toLowerCase())
      );
      return {
        customerId: c.customerId,
        customerName: c.customerName,
        companyName: c.companyName,
        ordersCount: (c.baseOrders || 0) + matching.length,
        totalUnitsOrdered: matching.reduce(
          (sum, o) => sum + (Number(o.quantity) || 0),
          0
        ),
      };
    });

    return res.json({
      success: true,
      message: 'Manufacturing reports generated from MongoDB',
      data: {
        totalOrders: orders.length,
        completedOrders,
        pendingOrders,
        productionPerformance,
        inventorySummary,
        customerOrderStatistics,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getReportsData };
