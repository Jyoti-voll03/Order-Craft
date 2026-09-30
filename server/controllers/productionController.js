const Production = require('../models/Production');
const Order = require('../models/Order');
const { generateNextId } = require('../utils/generateId');

// GET /api/production
async function getProduction(req, res, next) {
  try {
    const { status, priority, search } = req.query;
    const filter = {};

    if (status && status !== 'All') filter.status = status;
    if (priority && priority !== 'All') filter.priority = priority;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { productionId: regex },
        { orderId: regex },
        { productName: regex },
        { supervisor: regex },
      ];
    }

    const records = await Production.find(filter).sort({ createdAt: -1, productionId: 1 });
    return res.json({
      success: true,
      message: 'Production records retrieved successfully',
      data: records,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/production/:id
async function getProductionById(req, res, next) {
  try {
    const { id } = req.params;
    const record =
      (await Production.findOne({ productionId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Production.findById(id) : null);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Production record ${id} not found`,
        error: 'Not found',
      });
    }

    return res.json({
      success: true,
      message: 'Production record retrieved successfully',
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/production
async function createProduction(req, res, next) {
  try {
    const {
      productionId,
      id,
      orderId,
      productName,
      quantity,
      startDate,
      expectedCompletionDate,
      expectedCompletion,
      supervisor,
      workCenter,
      priority,
      status,
      progress,
    } = req.body;

    const finalId =
      productionId || id || (await generateNextId(Production, 'productionId', 'PRD-', 500));

    const numProgress = Math.max(0, Math.min(100, Number(progress) || 0));
    const finalStatus = numProgress === 100 ? 'Completed' : status || 'Scheduled';

    const newRecord = await Production.create({
      productionId: finalId,
      orderId: orderId || 'ORD-2026-1001',
      productName,
      quantity: Number(quantity) || 1,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      expectedCompletionDate:
        expectedCompletionDate ||
        expectedCompletion ||
        new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
      supervisor: supervisor || 'Rajesh Sharma',
      workCenter: workCenter || '5-Axis CNC Bay A',
      priority: priority || 'Medium',
      status: finalStatus,
      progress: numProgress,
    });

    // Synchronize related Order status if applicable
    if (newRecord.orderId) {
      if (finalStatus === 'Completed') {
        await Order.findOneAndUpdate(
          { orderId: newRecord.orderId },
          { status: 'Completed' }
        );
      } else if (finalStatus === 'In Progress') {
        await Order.findOneAndUpdate(
          { orderId: newRecord.orderId },
          { status: 'In Production' }
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Production run created successfully',
      data: newRecord,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/production/:id
async function updateProduction(req, res, next) {
  try {
    const { id } = req.params;
    const record =
      (await Production.findOne({ productionId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Production.findById(id) : null);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Production record ${id} not found`,
        error: 'Not found',
      });
    }

    const updates = { ...req.body };
    if (updates.expectedCompletion && !updates.expectedCompletionDate) {
      updates.expectedCompletionDate = updates.expectedCompletion;
    }
    if (updates.progress !== undefined) {
      updates.progress = Math.max(0, Math.min(100, Number(updates.progress)));
      if (updates.progress === 100) {
        updates.status = 'Completed';
      }
    }

    Object.assign(record, updates);
    await record.save();

    if (record.orderId && record.status === 'Completed') {
      await Order.findOneAndUpdate(
        { orderId: record.orderId },
        { status: 'Completed' }
      );
    }

    return res.json({
      success: true,
      message: 'Production record updated successfully',
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/production/:id/progress
async function updateProductionProgress(req, res, next) {
  try {
    const { id } = req.params;
    const { progress, delta } = req.body;

    const record =
      (await Production.findOne({ productionId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Production.findById(id) : null);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Production record ${id} not found`,
        error: 'Not found',
      });
    }

    let nextProgress =
      progress !== undefined
        ? Number(progress)
        : record.progress + (Number(delta) || 0);
    nextProgress = Math.max(0, Math.min(100, nextProgress));

    record.progress = nextProgress;
    if (nextProgress === 100) {
      record.status = 'Completed';
      if (record.orderId) {
        await Order.findOneAndUpdate(
          { orderId: record.orderId },
          { status: 'Completed' }
        );
      }
    } else if (nextProgress >= 85 && record.status !== 'Completed') {
      record.status = 'Quality Check';
    } else if (nextProgress > 0 && record.status === 'Scheduled') {
      record.status = 'In Progress';
      if (record.orderId) {
        await Order.findOneAndUpdate(
          { orderId: record.orderId },
          { status: 'In Production' }
        );
      }
    }

    await record.save();

    return res.json({
      success: true,
      message: 'Production progress updated successfully',
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/production/:id/status
async function updateProductionStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, progress } = req.body;

    const record =
      (await Production.findOne({ productionId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Production.findById(id) : null);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Production record ${id} not found`,
        error: 'Not found',
      });
    }

    record.status = status || record.status;
    if (status === 'Completed') {
      record.progress = 100;
      if (record.orderId) {
        await Order.findOneAndUpdate(
          { orderId: record.orderId },
          { status: 'Completed' }
        );
      }
    } else if (status === 'In Progress') {
      if (record.progress === 0) {
        record.progress = progress !== undefined ? Number(progress) : 15;
      }
      if (record.orderId) {
        await Order.findOneAndUpdate(
          { orderId: record.orderId },
          { status: 'In Production' }
        );
      }
    }

    await record.save();

    return res.json({
      success: true,
      message: 'Production status updated successfully',
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/production/:id
async function deleteProduction(req, res, next) {
  try {
    const { id } = req.params;
    const record =
      (await Production.findOneAndDelete({ productionId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Production.findByIdAndDelete(id) : null);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Production record ${id} not found`,
        error: 'Not found',
      });
    }

    return res.json({
      success: true,
      message: 'Production record deleted successfully',
      data: { id: record.productionId },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProduction,
  getProductionById,
  createProduction,
  updateProduction,
  updateProductionProgress,
  updateProductionStatus,
  deleteProduction,
};
