const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { generateNextId } = require('../utils/generateId');

// GET /api/orders
async function getOrders(req, res, next) {
  try {
    const { status, priority, search, startDate, endDate } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (priority && priority !== 'All') {
      filter.priority = priority;
    }
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = startDate;
      if (endDate) filter.orderDate.$lte = endDate;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { orderId: regex },
        { customerName: regex },
        { companyName: regex },
        { productName: regex },
      ];
    }

    const orders = await Order.find(filter).sort({ createdAt: -1, orderId: -1 });
    return res.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/orders/:id
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const order =
      (await Order.findOne({ orderId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Order.findById(id) : null);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${id} not found`,
        error: 'Not found',
      });
    }

    return res.json({
      success: true,
      message: 'Order retrieved successfully',
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/orders
async function createOrder(req, res, next) {
  try {
    const {
      orderId,
      id,
      customerId,
      customerName,
      companyName,
      productName,
      quantity,
      unitPrice,
      orderDate,
      expectedDeliveryDate,
      expectedDelivery,
      priority,
      status,
      notes,
    } = req.body;

    const finalOrderId =
      orderId || id || (await generateNextId(Order, 'orderId', 'ORD-2026-', 1000));

    // Resolve customerId/companyName if customer exists in DB
    let resolvedCustomerId = customerId || 'CUS-201';
    let resolvedCompany = companyName || 'Industrial Partner Pvt Ltd';
    if (customerName) {
      const cust = await Customer.findOne({
        customerName: new RegExp(`^${customerName.trim()}$`, 'i'),
      });
      if (cust) {
        resolvedCustomerId = cust.customerId;
        resolvedCompany = companyName || cust.companyName;
      }
    }

    const newOrder = await Order.create({
      orderId: finalOrderId,
      customerId: resolvedCustomerId,
      customerName,
      companyName: resolvedCompany,
      productName,
      quantity: Number(quantity) || 1,
      unitPrice: Number(unitPrice) || 150,
      orderDate: orderDate || new Date().toISOString().slice(0, 10),
      expectedDeliveryDate:
        expectedDeliveryDate ||
        expectedDelivery ||
        new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      priority: priority || 'Medium',
      status: status || 'Pending',
      notes: notes || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: newOrder,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/orders/:id
async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order =
      (await Order.findOne({ orderId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Order.findById(id) : null);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${id} not found`,
        error: 'Not found',
      });
    }

    const updates = { ...req.body };
    if (updates.expectedDelivery && !updates.expectedDeliveryDate) {
      updates.expectedDeliveryDate = updates.expectedDelivery;
    }
    if (updates.quantity !== undefined) updates.quantity = Number(updates.quantity);
    if (updates.unitPrice !== undefined) updates.unitPrice = Number(updates.unitPrice);

    Object.assign(order, updates);
    await order.save();

    return res.json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/orders/:id
async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order =
      (await Order.findOneAndDelete({ orderId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Order.findByIdAndDelete(id) : null);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${id} not found`,
        error: 'Not found',
      });
    }

    return res.json({
      success: true,
      message: 'Order deleted successfully',
      data: { id: order.orderId },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};
