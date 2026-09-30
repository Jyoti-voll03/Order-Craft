const { Inventory, computeStockStatus } = require('../models/Inventory');
const { generateNextId } = require('../utils/generateId');

// GET /api/inventory
async function getInventory(req, res, next) {
  try {
    const { search, status, category } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (status && status !== 'All') {
      filter.stockStatus = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { itemId: regex },
        { itemName: regex },
        { category: regex },
        { supplier: regex },
      ];
    }

    const items = await Inventory.find(filter).sort({ itemId: 1 });
    return res.json({
      success: true,
      message: 'Inventory retrieved successfully',
      data: items,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/inventory/:id
async function getInventoryById(req, res, next) {
  try {
    const { id } = req.params;
    const item =
      (await Inventory.findOne({ itemId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Inventory.findById(id) : null);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Inventory item ${id} not found`,
        error: 'Not found',
      });
    }

    return res.json({
      success: true,
      message: 'Inventory item retrieved successfully',
      data: item,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/inventory
async function createInventoryItem(req, res, next) {
  try {
    const {
      itemId,
      id,
      itemName,
      name,
      category,
      quantity,
      availableQuantity,
      unit,
      minimumStock,
      minStockLevel,
      unitCost,
      supplier,
      location,
    } = req.body;

    const finalId =
      itemId || id || (await generateNextId(Inventory, 'itemId', 'INV-', 300));
    const qty = Number(quantity ?? availableQuantity ?? 0);
    const min = Number(minimumStock ?? minStockLevel ?? 10);

    const newItem = await Inventory.create({
      itemId: finalId,
      itemName: itemName || name,
      category: category || 'Raw Material',
      quantity: qty,
      unit: unit || 'pcs',
      minimumStock: min,
      unitCost: Number(unitCost) || 35,
      supplier: supplier || 'Industrial Supplier',
      location: location || 'Rack A-01',
      stockStatus: computeStockStatus(qty, min),
    });

    return res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: newItem,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/inventory/:id
async function updateInventoryItem(req, res, next) {
  try {
    const { id } = req.params;
    const item =
      (await Inventory.findOne({ itemId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Inventory.findById(id) : null);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Inventory item ${id} not found`,
        error: 'Not found',
      });
    }

    if (req.body.itemName || req.body.name) {
      item.itemName = req.body.itemName || req.body.name;
    }
    if (req.body.category !== undefined) item.category = req.body.category;
    if (req.body.unit !== undefined) item.unit = req.body.unit;
    if (req.body.supplier !== undefined) item.supplier = req.body.supplier;
    if (req.body.location !== undefined) item.location = req.body.location;
    if (req.body.unitCost !== undefined) item.unitCost = Number(req.body.unitCost);

    if (req.body.delta !== undefined) {
      item.quantity = Math.max(0, item.quantity + Number(req.body.delta));
    } else if (
      req.body.quantity !== undefined ||
      req.body.availableQuantity !== undefined
    ) {
      item.quantity = Math.max(
        0,
        Number(req.body.quantity ?? req.body.availableQuantity)
      );
    }

    if (
      req.body.minimumStock !== undefined ||
      req.body.minStockLevel !== undefined
    ) {
      item.minimumStock = Math.max(
        0,
        Number(req.body.minimumStock ?? req.body.minStockLevel)
      );
    }

    item.stockStatus = computeStockStatus(item.quantity, item.minimumStock);
    await item.save();

    return res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: item,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/inventory/:id
async function deleteInventoryItem(req, res, next) {
  try {
    const { id } = req.params;
    const item =
      (await Inventory.findOneAndDelete({ itemId: id })) ||
      (id.match(/^[0-9a-fA-F]{24}$/) ? await Inventory.findByIdAndDelete(id) : null);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Inventory item ${id} not found`,
        error: 'Not found',
      });
    }

    return res.json({
      success: true,
      message: 'Inventory item deleted successfully',
      data: { id: item.itemId },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
};
