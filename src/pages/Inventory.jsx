import React, { useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  PackageCheck,
  PackageX,
  Plus,
  Edit3,
  Trash2,
  PackagePlus,
  Minus,
} from 'lucide-react';
import { useApp, getStockStatus } from '../context/AppContext';
import StatCard from '../components/StatCard';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const CATEGORIES = [
  'Raw Material',
  'Component',
  'Finished Product',
  'Packaging',
  'Maintenance',
];

const STOCK_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'];

const UNITS = ['pcs', 'kg', 'meters', 'liters', 'bars', 'sets', 'rolls'];

export default function Inventory() {
  const {
    inventory,
    getNextInventoryId,
    addInventoryItem,
    updateInventoryItem,
    adjustInventoryStock,
    deleteInventoryItem,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const emptyForm = {
    id: '',
    name: '',
    category: 'Raw Material',
    availableQuantity: 100,
    unit: 'pcs',
    minStockLevel: 40,
    unitCost: 45,
    supplier: '',
    location: 'Rack A-01',
  };

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      ...emptyForm,
      id: getNextInventoryId(),
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      name: item.name || '',
      category: item.category || 'Raw Material',
      availableQuantity: item.availableQuantity ?? 0,
      unit: item.unit || 'pcs',
      minStockLevel: item.minStockLevel ?? 10,
      unitCost: item.unitCost ?? 25,
      supplier: item.supplier || '',
      location: item.location || 'Rack A-01',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Item name is required';
    if (!formData.supplier.trim()) errs.supplier = 'Supplier name is required';
    if (
      formData.availableQuantity === '' ||
      Number(formData.availableQuantity) < 0
    ) {
      errs.availableQuantity = 'Quantity must be 0 or greater';
    }
    if (formData.minStockLevel === '' || Number(formData.minStockLevel) < 0) {
      errs.minStockLevel = 'Minimum stock level must be 0 or greater';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingItem) {
      updateInventoryItem(editingItem.id, formData);
    } else {
      addInventoryItem(formData);
    }
    setIsModalOpen(false);
  };

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q);

      const matchesCat =
        categoryFilter === 'All' || item.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'All' || item.stockStatus === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [inventory, searchQuery, categoryFilter, statusFilter]);

  const lowStockItems = inventory.filter((i) => i.stockStatus === 'Low Stock');
  const outOfStockItems = inventory.filter(
    (i) => i.stockStatus === 'Out of Stock'
  );
  const inStockItems = inventory.filter((i) => i.stockStatus === 'In Stock');

  const columns = [
    {
      key: 'id',
      label: 'Item ID',
      render: (row) => (
        <div>
          <span className="font-extrabold text-navy-900">{row.id}</span>
          <p className="text-[11px] text-slate-400">
            {row.location || 'Zone A'}
          </p>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Item Name',
      render: (row) => (
        <div className="max-w-[240px]">
          <p className="font-semibold text-slate-800 truncate" title={row.name}>
            {row.name}
          </p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
          {row.category}
        </span>
      ),
    },
    {
      key: 'availableQuantity',
      label: 'Available Quantity',
      render: (row) => {
        const ratio = Math.min(
          100,
          Math.round(
            (row.availableQuantity / Math.max(1, row.minStockLevel * 2)) * 100
          )
        );
        return (
          <div className="min-w-[150px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-extrabold text-navy-900">
                {row.availableQuantity} {row.unit}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustInventoryStock(row.id, -10)}
                  disabled={row.availableQuantity <= 0}
                  title="Issue 10 units"
                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustInventoryStock(row.id, 25)}
                  title="Restock +25 units"
                  className="px-1.5 h-5 rounded bg-orange-100 hover:bg-orange-200 text-orange-700 text-[10px] font-bold flex items-center justify-center"
                >
                  +25
                </button>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  row.stockStatus === 'Out of Stock'
                    ? 'bg-rose-500'
                    : row.stockStatus === 'Low Stock'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${ratio}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'unit',
      label: 'Unit',
      render: (row) => (
        <span className="text-xs font-semibold uppercase text-slate-500">
          {row.unit}
        </span>
      ),
    },
    {
      key: 'minStockLevel',
      label: 'Min Stock Level',
      render: (row) => (
        <span className="text-xs font-bold text-slate-700">
          {row.minStockLevel} {row.unit}
        </span>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.supplier}
        </span>
      ),
    },
    {
      key: 'stockStatus',
      label: 'Stock Status',
      render: (row) => <StatusBadge status={row.stockStatus} size="xs" />,
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="inline-flex items-center justify-end gap-1">
          {(row.stockStatus === 'Low Stock' ||
            row.stockStatus === 'Out of Stock') && (
            <button
              type="button"
              onClick={() => adjustInventoryStock(row.id, 50)}
              title="Restock +50 units"
              className="px-2 py-1 rounded-lg bg-navy-900 hover:bg-orange-500 text-white text-[11px] font-bold inline-flex items-center gap-1 transition mr-1"
            >
              <PackagePlus className="w-3 h-3" />
              Restock
            </button>
          )}
          <button
            type="button"
            onClick={() => openEditModal(row)}
            title="Edit Item"
            className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingItem(row)}
            title="Delete Item"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">
            Raw Material &amp; Finished Goods Inventory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Track warehouse stock quantities, automated safety thresholds, and supplier replenishment.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/20 flex items-center gap-2 self-start sm:self-auto transition"
        >
          <Plus className="w-4 h-4" />
          Add Inventory Item
        </button>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inventory SKUs"
          value={inventory.length}
          subtitle="Cataloged warehouse items"
          icon={Boxes}
          variant="navy"
          onClick={() => setStatusFilter('All')}
        />
        <StatCard
          title="Healthy In-Stock"
          value={inStockItems.length}
          subtitle="Above minimum safety level"
          icon={PackageCheck}
          variant="emerald"
          onClick={() => setStatusFilter('In Stock')}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockItems.length}
          subtitle="Requires reorder attention"
          icon={AlertTriangle}
          variant="amber"
          onClick={() => setStatusFilter('Low Stock')}
        />
        <StatCard
          title="Out of Stock Items"
          value={outOfStockItems.length}
          subtitle="Critical zero-balance SKUs"
          icon={PackageX}
          variant="rose"
          onClick={() => setStatusFilter('Out of Stock')}
        />
      </div>

      {/* Low Stock Alert Banner */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-navy-900">
                Warehouse Replenishment Alert:{' '}
                {lowStockItems.length + outOfStockItems.length} items need
                attention
              </h4>
              <p className="text-xs text-slate-600">
                {outOfStockItems.length} SKU(s) are Out of Stock and{' '}
                {lowStockItems.length} SKU(s) are running below minimum safety
                thresholds.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  statusFilter === 'Low Stock' ? 'All' : 'Low Stock'
                )
              }
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-100 transition"
            >
              {statusFilter === 'Low Stock'
                ? 'Show All Items'
                : 'Filter Low Stock'}
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by Item ID (INV-301), material name, category, or supplier..."
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-navy-900"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            {['All', ...STOCK_STATUSES].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <DataTable
        columns={columns}
        data={filteredInventory}
        pageSize={8}
        emptyTitle="No inventory items match your criteria"
        emptyDescription="Try adjusting your category or stock status filters."
      />

      {/* Add / Edit Inventory Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingItem
            ? `Edit Inventory Item (${editingItem.id})`
            : 'Add New Warehouse Inventory Item'
        }
        subtitle="Configure material specifications, safety stock level, and supplier details."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Item ID
              </label>
              <input
                type="text"
                value={formData.id}
                readOnly
                className="w-full px-3.5 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm font-bold text-navy-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Item Name / Material Specification <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., 6061-T6 Aluminum Billet Block (150x150mm)"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm ${
                  errors.name ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-rose-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Available Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.availableQuantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    availableQuantity: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Unit of Measure
              </label>
              <select
                value={formData.unit}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, unit: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Minimum Stock Level (Safety Threshold)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minStockLevel: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Computed Stock Status Preview
              </label>
              <div className="h-[38px] px-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">Auto Status:</span>
                <StatusBadge
                  status={getStockStatus(
                    formData.availableQuantity,
                    formData.minStockLevel
                  )}
                  size="xs"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Primary Supplier <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, supplier: e.target.value }))
                }
                placeholder="e.g., Hindalco Precision Alloys"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm ${
                  errors.supplier ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.supplier && (
                <p className="text-xs text-rose-600 mt-1">{errors.supplier}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm transition"
            >
              {editingItem ? 'Update Inventory Item' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) deleteInventoryItem(deletingItem.id);
        }}
        title={`Delete Inventory Item ${deletingItem?.id}?`}
        message={`Are you sure you want to remove "${deletingItem?.name}" from the warehouse catalog?`}
      />
    </div>
  );
}
