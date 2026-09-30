import React, { useState, useMemo } from 'react';
import {
  Factory,
  Play,
  CheckCircle2,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  UserCheck,
  Gauge,
  LayoutList,
  Kanban,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const PROD_STATUSES = [
  'Scheduled',
  'In Progress',
  'Quality Check',
  'Paused',
  'Completed',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const SUPERVISORS = [
  'Rajesh Sharma',
  'Ananya Verma',
  'Vikram Patel',
  'Meera Nair',
  'Karthik Iyer',
];

export default function Production() {
  const {
    production,
    orders,
    getNextProductionId,
    addProduction,
    updateProduction,
    startProduction,
    completeProduction,
    updateProductionProgress,
    deleteProduction,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'schedule'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState(null);
  const [deletingProd, setDeletingProd] = useState(null);

  const emptyForm = {
    id: '',
    orderId: orders[0]?.id || 'ORD-2026-1001',
    productName: orders[0]?.productName || '',
    quantity: orders[0]?.quantity || 100,
    startDate: new Date().toISOString().slice(0, 10),
    expectedCompletion: '2026-10-20',
    supervisor: 'Rajesh Sharma',
    workCenter: '5-Axis CNC Bay A',
    priority: 'High',
    status: 'Scheduled',
    progress: 0,
  };

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const openCreateModal = () => {
    setEditingProd(null);
    const defaultOrder = orders[0];
    setFormData({
      ...emptyForm,
      id: getNextProductionId(),
      orderId: defaultOrder?.id || 'ORD-2026-1001',
      productName: defaultOrder?.productName || '',
      quantity: defaultOrder?.quantity || 100,
      priority: defaultOrder?.priority || 'Medium',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProd(prod);
    setFormData({
      id: prod.id,
      orderId: prod.orderId || '',
      productName: prod.productName || '',
      quantity: prod.quantity || 1,
      startDate: prod.startDate || '',
      expectedCompletion: prod.expectedCompletion || '',
      supervisor: prod.supervisor || 'Rajesh Sharma',
      workCenter: prod.workCenter || '5-Axis CNC Bay A',
      priority: prod.priority || 'Medium',
      status: prod.status || 'Scheduled',
      progress: prod.progress ?? 0,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrs = {};
    if (!formData.productName.trim())
      newErrs.productName = 'Product name is required';
    if (!formData.supervisor.trim())
      newErrs.supervisor = 'Supervisor is required';
    if (!formData.quantity || Number(formData.quantity) <= 0)
      newErrs.quantity = 'Quantity must be > 0';
    if (!formData.startDate) newErrs.startDate = 'Start date is required';
    if (!formData.expectedCompletion)
      newErrs.expectedCompletion = 'Expected completion is required';
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingProd) {
      updateProduction(editingProd.id, formData);
    } else {
      addProduction(formData);
    }
    setIsModalOpen(false);
  };

  // Filtered production runs
  const filteredProduction = useMemo(() => {
    return production.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.id.toLowerCase().includes(q) ||
        (p.orderId && p.orderId.toLowerCase().includes(q)) ||
        p.productName.toLowerCase().includes(q) ||
        p.supervisor.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'All' || p.status === statusFilter;
      const matchesPriority =
        priorityFilter === 'All' || p.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [production, searchQuery, statusFilter, priorityFilter]);

  const avgProgress = useMemo(() => {
    if (production.length === 0) return 0;
    const sum = production.reduce((acc, p) => acc + (Number(p.progress) || 0), 0);
    return Math.round(sum / production.length);
  }, [production]);

  const columns = [
    {
      key: 'id',
      label: 'Prod ID / Order',
      render: (row) => (
        <div>
          <span className="font-extrabold text-navy-900">{row.id}</span>
          <p className="text-[11px] font-semibold text-orange-600">
            Ref: {row.orderId}
          </p>
        </div>
      ),
    },
    {
      key: 'productName',
      label: 'Product & Work Center',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 max-w-[230px] truncate">
            {row.productName}
          </p>
          <p className="text-xs text-slate-500">
            {row.workCenter || 'CNC Machining Cell'} •{' '}
            <strong className="text-navy-900">{row.quantity} pcs</strong>
          </p>
        </div>
      ),
    },
    {
      key: 'supervisor',
      label: 'Supervisor',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-navy-900 text-xs font-bold flex items-center justify-center">
            {row.supervisor
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <span className="text-xs font-semibold text-slate-700">
            {row.supervisor}
          </span>
        </div>
      ),
    },
    {
      key: 'schedule',
      label: 'Schedule Window',
      render: (row) => (
        <div className="text-xs">
          <p className="text-slate-500">Start: {row.startDate}</p>
          <p className="font-semibold text-navy-900">
            Due: {row.expectedCompletion}
          </p>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => <StatusBadge status={row.priority} size="xs" />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'progress',
      label: 'Progress & Live Control',
      render: (row) => (
        <div className="min-w-[190px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-navy-900">{row.progress}%</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateProductionProgress(row.id, -10)}
                disabled={row.progress <= 0}
                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 disabled:opacity-40"
                title="Decrease progress by 10%"
              >
                -10%
              </button>
              <button
                type="button"
                onClick={() => updateProductionProgress(row.id, 10)}
                disabled={row.progress >= 100}
                className="px-1.5 py-0.5 rounded bg-orange-100 hover:bg-orange-200 text-[10px] font-bold text-orange-700 disabled:opacity-40"
                title="Increase progress by 10%"
              >
                +10%
              </button>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                row.progress === 100
                  ? 'bg-emerald-500'
                  : row.progress >= 80
                  ? 'bg-indigo-500'
                  : 'bg-orange-500'
              }`}
              style={{ width: `${row.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Shop-Floor Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="inline-flex items-center justify-end gap-1.5">
          {(row.status === 'Scheduled' || row.status === 'Paused') && (
            <button
              type="button"
              onClick={() => startProduction(row.id)}
              className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs transition"
              title="Start Production Run"
            >
              <Play className="w-3 h-3 fill-current" />
              Start
            </button>
          )}
          {row.status !== 'Completed' && (
            <button
              type="button"
              onClick={() => completeProduction(row.id)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs transition"
              title="Complete Production Run (100%)"
            >
              <CheckCircle2 className="w-3 h-3" />
              Complete
            </button>
          )}
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition"
            title="Edit Production Record"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingProd(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Delete Production Run"
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
            Production Management &amp; Shop-Floor Control
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Schedule manufacturing runs, assign floor supervisors, and control live batch progress.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'table'
                  ? 'bg-navy-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('schedule')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'schedule'
                  ? 'bg-navy-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Schedule Cards
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/20 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Schedule Run
          </button>
        </div>
      </div>

      {/* Production Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Production Runs"
          value={production.length}
          subtitle="Active & scheduled batches"
          icon={Factory}
          variant="navy"
        />
        <StatCard
          title="Active Shop-Floor Runs"
          value={
            production.filter(
              (p) => p.status === 'In Progress' || p.status === 'Quality Check'
            ).length
          }
          subtitle="Machining & QC bays active"
          icon={Gauge}
          variant="orange"
          trend={`Avg ${avgProgress}% Done`}
        />
        <StatCard
          title="Scheduled / Queued"
          value={
            production.filter(
              (p) => p.status === 'Scheduled' || p.status === 'Paused'
            ).length
          }
          subtitle="Ready for start release"
          icon={Clock}
          variant="amber"
        />
        <StatCard
          title="Completed Batches"
          value={production.filter((p) => p.status === 'Completed').length}
          subtitle="100% inspected & cleared"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by Production ID (PRD-501), Order ID, product, or supervisor..."
        />

        <div className="flex flex-wrap items-center gap-2">
          {['All', ...PROD_STATUSES].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-navy-900"
          >
            <option value="All">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p} Priority
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table View vs Interactive Schedule Cards View */}
      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={filteredProduction}
          pageSize={8}
          emptyTitle="No production runs found"
          emptyDescription="Try changing your status filter or schedule a new manufacturing run."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProduction.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-navy-900 text-white">
                    {prod.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={prod.priority} size="xs" />
                    <StatusBadge status={prod.status} size="xs" />
                  </div>
                </div>

                <h4 className="text-base font-extrabold text-navy-900 mt-3">
                  {prod.productName}
                </h4>
                <p className="text-xs text-orange-600 font-semibold mt-0.5">
                  Linked Order: {prod.orderId} • Batch Qty: {prod.quantity} units
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Supervisor</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                      {prod.supervisor}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Completion Target</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {prod.expectedCompletion}
                    </span>
                  </div>
                </div>

                {/* Interactive Range Slider for Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-600">
                      Completion Progress
                    </span>
                    <span className="font-extrabold text-navy-900">
                      {prod.progress}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={prod.progress}
                    onChange={(e) =>
                      updateProductionProgress(prod.id, Number(e.target.value), true)
                    }
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {(prod.status === 'Scheduled' || prod.status === 'Paused') && (
                    <button
                      type="button"
                      onClick={() => startProduction(prod.id)}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Start Production
                    </button>
                  )}
                  {prod.status !== 'Completed' && (
                    <button
                      type="button"
                      onClick={() => completeProduction(prod.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Complete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(prod)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingProd(prod)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule / Edit Production Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingProd
            ? `Update Production Run (${editingProd.id})`
            : 'Schedule New Production Run'
        }
        subtitle="Link to a customer order, assign a floor supervisor, and set target completion."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Production ID
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
                Related Order ID
              </label>
              <select
                value={formData.orderId}
                onChange={(e) => {
                  const selId = e.target.value;
                  const matchOrder = orders.find((o) => o.id === selId);
                  setFormData((prev) => ({
                    ...prev,
                    orderId: selId,
                    productName: matchOrder ? matchOrder.productName : prev.productName,
                    quantity: matchOrder ? matchOrder.quantity : prev.quantity,
                    priority: matchOrder ? matchOrder.priority : prev.priority,
                  }));
                }}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} — {o.customerName}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, productName: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              />
              {errors.productName && (
                <p className="text-xs text-rose-600 mt-1">{errors.productName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Batch Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Assigned Supervisor <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.supervisor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, supervisor: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              >
                {SUPERVISORS.map((sup) => (
                  <option key={sup} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Expected Completion Date
              </label>
              <input
                type="date"
                value={formData.expectedCompletion}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expectedCompletion: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Production Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => {
                  const st = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    status: st,
                    progress: st === 'Completed' ? 100 : prev.progress,
                  }));
                }}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              >
                {PROD_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Progress Percentage ({formData.progress}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.progress}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    progress: Number(e.target.value),
                  }))
                }
                className="w-full mt-2 accent-orange-500"
              />
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
              {editingProd ? 'Save Production Update' : 'Schedule Run'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingProd)}
        onClose={() => setDeletingProd(null)}
        onConfirm={() => {
          if (deletingProd) deleteProduction(deletingProd.id);
        }}
        title={`Remove Production Run ${deletingProd?.id}?`}
        message={`Are you sure you want to remove ${deletingProd?.id} (${deletingProd?.productName}) from the shop-floor schedule?`}
      />
    </div>
  );
}
