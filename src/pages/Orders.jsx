import React, { useState, useMemo } from 'react';
import {
  Plus,
  Eye,
  Edit3,
  Trash2,
  Filter,
  Calendar,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  FileText,
  IndianRupee,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'In Production',
  'Completed',
  'Delivered',
  'Cancelled',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function Orders() {
  const {
    orders,
    customers,
    production,
    getNextOrderId,
    addOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
  } = useApp();

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);

  // Form State & Validation
  const emptyForm = {
    id: '',
    customerName: '',
    companyName: '',
    productName: '',
    quantity: 100,
    unitPrice: 180,
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDelivery: '2026-10-25',
    priority: 'Medium',
    status: 'Pending',
    notes: '',
  };
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const openCreateModal = () => {
    setEditingOrder(null);
    setFormData({
      ...emptyForm,
      id: getNextOrderId(),
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setFormData({
      id: order.id,
      customerName: order.customerName || '',
      companyName: order.companyName || '',
      productName: order.productName || '',
      quantity: order.quantity || 1,
      unitPrice: order.unitPrice || 150,
      orderDate: order.orderDate || '',
      expectedDelivery: order.expectedDelivery || '',
      priority: order.priority || 'Medium',
      status: order.status || 'Pending',
      notes: order.notes || '',
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!formData.orderDate) {
      newErrors.orderDate = 'Order date is required';
    }
    if (!formData.expectedDelivery) {
      newErrors.expectedDelivery = 'Expected delivery date is required';
    } else if (
      formData.orderDate &&
      formData.expectedDelivery < formData.orderDate
    ) {
      newErrors.expectedDelivery = 'Delivery date cannot be earlier than order date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Auto-populate companyName if customer matches directory
    const matchedCust = customers.find(
      (c) => c.name.toLowerCase() === formData.customerName.trim().toLowerCase()
    );
    const payload = {
      ...formData,
      companyName:
        formData.companyName || matchedCust?.company || 'Industrial Partner Pvt Ltd',
    };

    if (editingOrder) {
      updateOrder(editingOrder.id, payload);
    } else {
      addOrder(payload);
    }
    setIsFormOpen(false);
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        (order.companyName && order.companyName.toLowerCase().includes(q)) ||
        order.productName.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'All' || order.status === statusFilter;

      const matchesPriority =
        priorityFilter === 'All' || order.priority === priorityFilter;

      const matchesDateFrom = !dateFrom || order.orderDate >= dateFrom;
      const matchesDateTo = !dateTo || order.orderDate <= dateTo;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [orders, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo]);

  // Total Value across all active (non-cancelled) orders
  const totalPipelineValue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce(
        (sum, o) => sum + (Number(o.quantity) || 0) * (Number(o.unitPrice) || 150),
        0
      );
  }, [orders]);

  // Table Columns
  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (row) => (
        <div>
          <span className="font-extrabold text-navy-900">{row.id}</span>
          <p className="text-[11px] text-slate-400">Ordered: {row.orderDate}</p>
        </div>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.customerName}</p>
          <p className="text-xs text-slate-500 truncate max-w-[180px]">
            {row.companyName || 'Direct Industrial Account'}
          </p>
        </div>
      ),
    },
    {
      key: 'productName',
      label: 'Product & Qty',
      render: (row) => (
        <div>
          <p className="font-semibold text-navy-900 max-w-[240px] truncate">
            {row.productName}
          </p>
          <p className="text-xs font-semibold text-orange-600">
            {row.quantity} units
          </p>
        </div>
      ),
    },
    {
      key: 'totalValue',
      label: 'Total Value',
      render: (row) => {
        const unitPrice = Number(row.unitPrice) || 150;
        const totalVal = (Number(row.quantity) || 0) * unitPrice;
        return (
          <div>
            <span className="font-extrabold text-navy-900">
              ₹{totalVal.toLocaleString('en-IN')}
            </span>
            <p className="text-[11px] text-slate-400">
              @ ₹{unitPrice.toLocaleString('en-IN')}/unit
            </p>
          </div>
        );
      },
    },
    {
      key: 'expectedDelivery',
      label: 'Expected Delivery',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {row.expectedDelivery}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => <StatusBadge status={row.priority} size="xs" />,
    },
    {
      key: 'status',
      label: 'Order Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <select
            value={row.status}
            onChange={(e) => updateOrderStatus(row.id, e.target.value)}
            aria-label={`Change status for ${row.id}`}
            className="text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-navy-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 cursor-pointer"
          >
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="inline-flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setViewingOrder(row)}
            title="View Order Details"
            className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            title="Edit Order"
            className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingOrder(row)}
            title="Delete Order"
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
      {/* Top Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">
            Customer Orders &amp; Fulfillment Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Create, track, prioritize, and update manufacturing customer orders from confirmation to delivery.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/20 flex items-center gap-2 self-start sm:self-auto transition"
        >
          <Plus className="w-4 h-4" />
          Add New Order
        </button>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Orders"
          value={orders.length}
          subtitle="Active & archived records"
          icon={ShoppingCart}
          variant="navy"
        />
        <StatCard
          title="Total Order Value"
          value={`₹${totalPipelineValue.toLocaleString('en-IN')}`}
          subtitle="Net value (excl. cancelled)"
          icon={IndianRupee}
          variant="indigo"
          trend="Active Pipeline"
        />
        <StatCard
          title="Pending & Confirmed"
          value={
            orders.filter(
              (o) => o.status === 'Pending' || o.status === 'Confirmed'
            ).length
          }
          subtitle="Ready for shop-floor scheduling"
          icon={Clock}
          variant="amber"
        />
        <StatCard
          title="In Production"
          value={orders.filter((o) => o.status === 'In Production').length}
          subtitle="Currently being manufactured"
          icon={CheckCircle2}
          variant="orange"
        />
        <StatCard
          title="Completed & Delivered"
          value={
            orders.filter(
              (o) => o.status === 'Completed' || o.status === 'Delivered'
            ).length
          }
          subtitle="Fulfilled customer shipments"
          icon={Truck}
          variant="emerald"
        />
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by Order ID (e.g. ORD-2026-1001), customer name, or product..."
          />

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-bold text-navy-900 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                {ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-500">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs font-bold text-navy-900 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="All">All Priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-500">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs font-semibold text-navy-900 bg-transparent focus:outline-none"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs font-semibold text-navy-900 bg-transparent focus:outline-none"
              />
            </div>

            {(searchQuery ||
              statusFilter !== 'All' ||
              priorityFilter !== 'All' ||
              dateFrom ||
              dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setPriorityFilter('All');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders DataTable */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        pageSize={8}
        emptyTitle="No manufacturing orders match your filter"
        emptyDescription="Try clearing your search or status filters, or create a new customer order."
        emptyAction={
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition"
          >
            + Add New Order
          </button>
        }
      />

      {/* Create / Edit Order Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          editingOrder
            ? `Edit Manufacturing Order (${editingOrder.id})`
            : 'Create New Manufacturing Order'
        }
        subtitle="Enter customer specifications, unit pricing, delivery dates, and production priority."
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auto-Generated Order ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Order ID (Auto-Generated)
              </label>
              <input
                type="text"
                value={formData.id}
                readOnly
                className="w-full px-3.5 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm font-bold text-navy-900 cursor-not-allowed"
              />
            </div>

            {/* Customer Name (with datalist of existing customers) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="ordercraft-customer-list"
                value={formData.customerName}
                onChange={(e) => {
                  const val = e.target.value;
                  const match = customers.find(
                    (c) => c.name.toLowerCase() === val.toLowerCase()
                  );
                  setFormData((prev) => ({
                    ...prev,
                    customerName: val,
                    companyName: match ? match.company : prev.companyName,
                  }));
                }}
                placeholder="Select or type customer name"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                  errors.customerName ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              <datalist id="ordercraft-customer-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.company}
                  </option>
                ))}
              </datalist>
              {errors.customerName && (
                <p className="text-xs text-rose-600 mt-1">{errors.customerName}</p>
              )}
            </div>

            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Product Name / Specification <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, productName: e.target.value }))
                }
                placeholder="e.g., CNC Machined Aluminum Enclosure (IP67)"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                  errors.productName ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.productName && (
                <p className="text-xs text-rose-600 mt-1">{errors.productName}</p>
              )}
            </div>

            {/* Product Quantity */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Product Quantity (Units) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                  errors.quantity ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.quantity && (
                <p className="text-xs text-rose-600 mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Unit Price (₹) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Unit Price (₹ / Unit) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, unitPrice: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>

            {/* Live Computed Total Order Value Banner */}
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-800 block">
                  Calculated Total Order Value
                </span>
                <span className="text-xs text-slate-600">
                  {Number(formData.quantity) || 0} units × ₹
                  {(Number(formData.unitPrice) || 0).toLocaleString('en-IN')} per unit
                </span>
              </div>
              <span className="text-xl font-extrabold text-navy-900">
                ₹
                {(
                  (Number(formData.quantity) || 0) *
                  (Number(formData.unitPrice) || 0)
                ).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, priority: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Order Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Order Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                {ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Order Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Order Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, orderDate: e.target.value }))
                }
                className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                  errors.orderDate ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.orderDate && (
                <p className="text-xs text-rose-600 mt-1">{errors.orderDate}</p>
              )}
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Expected Delivery Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expectedDelivery}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expectedDelivery: e.target.value,
                  }))
                }
                className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${
                  errors.expectedDelivery ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.expectedDelivery && (
                <p className="text-xs text-rose-600 mt-1">
                  {errors.expectedDelivery}
                </p>
              )}
            </div>

            {/* Additional Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Additional Engineering &amp; Delivery Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Specify surface finish, tolerance certifications, or packaging instructions..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm transition"
            >
              {editingOrder ? 'Save Order Changes' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Order Details Modal */}
      <Modal
        isOpen={Boolean(viewingOrder)}
        onClose={() => setViewingOrder(null)}
        title={viewingOrder ? `Order Specification — ${viewingOrder.id}` : ''}
        subtitle="Comprehensive manufacturing order dossier and live status"
        size="lg"
      >
        {viewingOrder && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Product Specification</p>
                <h4 className="text-base font-extrabold text-navy-900 mt-0.5">
                  {viewingOrder.productName}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={viewingOrder.priority} />
                <StatusBadge status={viewingOrder.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase">Customer</p>
                <p className="text-sm font-bold text-navy-900 mt-1">
                  {viewingOrder.customerName}
                </p>
                <p className="text-slate-500 truncate">{viewingOrder.companyName}</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase">Order Quantity</p>
                <p className="text-sm font-bold text-orange-600 mt-1">
                  {viewingOrder.quantity} Units
                </p>
                <p className="text-slate-500">
                  @ ₹{(Number(viewingOrder.unitPrice) || 150).toLocaleString('en-IN')}/unit
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200">
                <p className="text-orange-700 font-bold uppercase">Total Value</p>
                <p className="text-sm font-extrabold text-navy-900 mt-1">
                  ₹
                  {(
                    (Number(viewingOrder.quantity) || 0) *
                    (Number(viewingOrder.unitPrice) || 150)
                  ).toLocaleString('en-IN')}
                </p>
                <p className="text-slate-500">Net Invoice Value</p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase">Timeline</p>
                <p className="text-slate-700 font-semibold mt-1">
                  Ordered: {viewingOrder.orderDate}
                </p>
                <p className="text-navy-900 font-bold">
                  Due: {viewingOrder.expectedDelivery}
                </p>
              </div>
            </div>

            {/* Linked Production Batch if any */}
            {(() => {
              const linkedProd = production.find(
                (p) => p.orderId === viewingOrder.id
              );
              return linkedProd ? (
                <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                      Linked Shop-Floor Production Run: {linkedProd.id}
                    </span>
                    <StatusBadge status={linkedProd.status} size="xs" />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Supervisor: <strong className="text-navy-900">{linkedProd.supervisor}</strong> • Work Center: {linkedProd.workCenter || 'CNC Bay'} • Progress: <strong>{linkedProd.progress}%</strong>
                  </p>
                </div>
              ) : null;
            })()}

            {/* Notes */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-orange-500" />
                Engineering &amp; Dispatch Notes
              </p>
              <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
                {viewingOrder.notes ||
                  'Standard manufacturing tolerances apply per ISO 2768-m.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Quick Update Status:
                </span>
                <select
                  value={viewingOrder.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    updateOrderStatus(viewingOrder.id, nextStatus);
                    setViewingOrder((prev) => ({ ...prev, status: nextStatus }));
                  }}
                  className="text-xs font-bold rounded-lg border border-slate-300 px-2.5 py-1.5 text-navy-900"
                >
                  {ORDER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingOrder;
                    setViewingOrder(null);
                    openEditModal(target);
                  }}
                  className="px-4 py-2 rounded-lg bg-navy-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  Edit Order
                </button>
                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingOrder)}
        onClose={() => setDeletingOrder(null)}
        onConfirm={() => {
          if (deletingOrder) deleteOrder(deletingOrder.id);
        }}
        title={`Delete Order ${deletingOrder?.id}?`}
        message={`Are you sure you want to permanently delete order ${deletingOrder?.id} (${deletingOrder?.productName}) for ${deletingOrder?.customerName}?`}
        confirmText="Delete Order"
      />
    </div>
  );
}
