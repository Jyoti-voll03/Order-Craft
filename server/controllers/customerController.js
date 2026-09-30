const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { generateNextId } = require('../utils/generateId');

async function attachCustomerOrderMetrics(customerDoc, allOrders) {
  const obj = customerDoc.toJSON ? customerDoc.toJSON() : { ...customerDoc };
  const matchingOrders = allOrders.filter(
    (o) =>
      o.customerId === obj.customerId ||
      (o.customerName &&
        obj.customerName &&
        o.customerName.toLowerCase() === obj.customerName.toLowerCase()) ||
      (o.companyName &&
        obj.companyName &&
        o.companyName.toLowerCase() === obj.companyName.toLowerCase())
  );

  obj.ordersCount = (Number(obj.baseOrders) || 0) + matchingOrders.length;
  obj.recentOrders = matchingOrders;
  return obj;
}

// GET /api/customers
async function getCustomers(req, res, next) {
  try {
    const { search } = req.query;
    const filter = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { customerId: regex },
        { customerName: regex },
        { companyName: regex },
        { email: regex },
        { phone: regex },
        { address: regex },
      ];
    }

    const [customers, allOrders] = await Promise.all([
      Customer.find(filter).sort({ customerId: 1 }),
      Order.find().sort({ createdAt: -1 }),
    ]);

    const enriched = await Promise.all(
      customers.map((c) => attachCustomerOrderMetrics(c, allOrders))
    );

    return res.json({
      success: true,
      message: 'Customers retrieved successfully',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/customers/:id
async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;
    const customer =
      (await Customer.findOne({ customerId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Customer.findById(id) : null);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer ${id} not found`,
        error: 'Not found',
      });
    }

    const allOrders = await Order.find().sort({ createdAt: -1 });
    const enriched = await attachCustomerOrderMetrics(customer, allOrders);

    return res.json({
      success: true,
      message: 'Customer retrieved successfully',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/customers/:id/orders
async function getCustomerOrders(req, res, next) {
  try {
    const { id } = req.params;
    const customer =
      (await Customer.findOne({ customerId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Customer.findById(id) : null);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer ${id} not found`,
        error: 'Not found',
      });
    }

    const orders = await Order.find({
      $or: [
        { customerId: customer.customerId },
        { customerName: new RegExp(`^${customer.customerName}$`, 'i') },
        { companyName: new RegExp(`^${customer.companyName}$`, 'i') },
      ],
    }).sort({ orderDate: -1 });

    return res.json({
      success: true,
      message: `Order history for ${customer.customerName} retrieved`,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/customers
async function createCustomer(req, res, next) {
  try {
    const {
      customerId,
      id,
      customerName,
      name,
      companyName,
      company,
      email,
      phone,
      address,
      industry,
      baseOrders,
    } = req.body;

    const finalId =
      customerId || id || (await generateNextId(Customer, 'customerId', 'CUS-', 200));

    const newCustomer = await Customer.create({
      customerId: finalId,
      customerName: customerName || name,
      companyName: companyName || company,
      email,
      phone,
      address,
      industry: industry || 'Industrial Manufacturing',
      baseOrders: Number(baseOrders) || 0,
    });

    const allOrders = await Order.find();
    const enriched = await attachCustomerOrderMetrics(newCustomer, allOrders);

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/customers/:id
async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const customer =
      (await Customer.findOne({ customerId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Customer.findById(id) : null);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer ${id} not found`,
        error: 'Not found',
      });
    }

    if (req.body.customerName || req.body.name) {
      customer.customerName = req.body.customerName || req.body.name;
    }
    if (req.body.companyName || req.body.company) {
      customer.companyName = req.body.companyName || req.body.company;
    }
    if (req.body.email !== undefined) customer.email = req.body.email;
    if (req.body.phone !== undefined) customer.phone = req.body.phone;
    if (req.body.address !== undefined) customer.address = req.body.address;
    if (req.body.industry !== undefined) customer.industry = req.body.industry;
    if (req.body.baseOrders !== undefined)
      customer.baseOrders = Number(req.body.baseOrders);

    await customer.save();
    const allOrders = await Order.find();
    const enriched = await attachCustomerOrderMetrics(customer, allOrders);

    return res.json({
      success: true,
      message: 'Customer updated successfully',
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/customers/:id
async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const customer =
      (await Customer.findOneAndDelete({ customerId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Customer.findByIdAndDelete(id) : null);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer ${id} not found`,
        error: 'Not found',
      });
    }

    return res.json({
      success: true,
      message: 'Customer deleted successfully',
      data: { id: customer.customerId },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  getCustomerOrders,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
