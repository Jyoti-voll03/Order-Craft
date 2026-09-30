import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  Mail,
  Phone,
  MapPin,
  Plus,
  Eye,
  Edit3,
  Trash2,
  ShoppingBag,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Customers() {
  const {
    customers,
    getNextCustomerId,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  const emptyForm = {
    id: '',
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    baseOrders: 1,
    industry: 'Industrial Manufacturing',
  };

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      ...emptyForm,
      id: getNextCustomerId(),
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      id: cust.id,
      name: cust.name || '',
      company: cust.company || '',
      email: cust.email || '',
      phone: cust.phone || '',
      address: cust.address || '',
      baseOrders: cust.baseOrders ?? 0,
      industry: cust.industry || 'Industrial Manufacturing',
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Customer name is required';
    if (!formData.company.trim()) errs.company = 'Company name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errs.email = 'Valid email address is required';
    }
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.address.trim()) errs.address = 'Address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    setIsFormOpen(false);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery]);

  const totalOrdersAcrossCustomers = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.ordersCount || 0), 0);
  }, [customers]);

  const topCustomer = useMemo(() => {
    if (customers.length === 0) return null;
    return [...customers].sort(
      (a, b) => (b.ordersCount || 0) - (a.ordersCount || 0)
    )[0];
  }, [customers]);

  const columns = [
    {
      key: 'id',
      label: 'Customer ID',
      render: (row) => (
        <span className="font-extrabold text-navy-900">{row.id}</span>
      ),
    },
    {
      key: 'name',
      label: 'Customer & Company',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-navy-900 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">
            {row.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <p className="font-bold text-navy-900">{row.name}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-orange-500" />
              {row.company}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Email & Phone',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <p className="text-slate-700 font-medium flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            {row.email}
          </p>
          <p className="text-slate-500 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            {row.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Plant / Office Address',
      render: (row) => (
        <p
          className="text-xs text-slate-600 max-w-[240px] truncate"
          title={row.address}
        >
          {row.address}
        </p>
      ),
    },
    {
      key: 'ordersCount',
      label: 'Number of Orders',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedCustomer(row)}
          className="px-3 py-1 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold inline-flex items-center gap-1.5 transition"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {row.ordersCount} Orders
        </button>
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
            onClick={() => setSelectedCustomer(row)}
            title="View Customer Order History"
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-navy-900 hover:text-white text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition mr-1"
          >
            <Eye className="w-3.5 h-3.5" />
            History
          </button>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            title="Edit Customer"
            className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingCustomer(row)}
            title="Delete Customer"
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
            B2B Customer Directory &amp; Account History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage industrial clients, corporate contacts, delivery addresses, and historical order portfolios.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/20 flex items-center gap-2 self-start sm:self-auto transition"
        >
          <Plus className="w-4 h-4" />
          Add New Customer
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total B2B Customers"
          value={customers.length}
          subtitle="Verified enterprise accounts"
          icon={Users}
          variant="navy"
        />
        <StatCard
          title="Cumulative Orders"
          value={totalOrdersAcrossCustomers}
          subtitle="Lifetime manufacturing contracts"
          icon={ShoppingBag}
          variant="orange"
        />
        <StatCard
          title="Top Account Volume"
          value={topCustomer ? `${topCustomer.ordersCount} Orders` : '0'}
          subtitle={topCustomer ? topCustomer.company : 'N/A'}
          icon={Award}
          variant="emerald"
        />
        <StatCard
          title="Active Industries"
          value="7 Sectors"
          subtitle="Aerospace, Auto, Marine, Energy"
          icon={Building2}
          variant="indigo"
        />
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search customers by ID (CUS-201), contact name, company, email, phone, or city..."
        />
      </div>

      {/* Customer Directory Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        pageSize={8}
        emptyTitle="No matching customers found"
        emptyDescription="Try searching for a different company name or add a new B2B customer."
      />

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          editingCustomer
            ? `Edit Customer (${editingCustomer.id})`
            : 'Add New B2B Customer'
        }
        subtitle="Enter corporate contact information and shipping address."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Customer ID
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
                Customer Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Arjun Mehta"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm ${
                  errors.name ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-rose-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                placeholder="e.g., Apex Heavy Industries Ltd."
                className={`w-full px-3.5 py-2 rounded-lg border text-sm ${
                  errors.company ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.company && (
                <p className="text-xs text-rose-600 mt-1">{errors.company}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="contact@company.in"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm ${
                  errors.email ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-rose-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+91 98201 44510"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm ${
                  errors.phone ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.phone && (
                <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Delivery &amp; Billing Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Plot, Industrial Area, City, State, PIN"
                className={`w-full px-3.5 py-2 rounded-lg border text-sm ${
                  errors.address ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.address && (
                <p className="text-xs text-rose-600 mt-1">{errors.address}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm transition"
            >
              {editingCustomer ? 'Save Customer Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Details & Order History Modal */}
      <Modal
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={
          selectedCustomer
            ? `${selectedCustomer.name} — Customer Dossier & Order History`
            : ''
        }
        subtitle={selectedCustomer?.company}
        size="xl"
      >
        {selectedCustomer && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-bold uppercase">
                  Account Identifier
                </p>
                <p className="text-base font-extrabold text-navy-900 mt-1">
                  {selectedCustomer.id}
                </p>
                <p className="text-slate-600 mt-0.5">
                  {selectedCustomer.company}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-bold uppercase">
                  Direct Contact
                </p>
                <p className="font-semibold text-navy-900 mt-1">
                  {selectedCustomer.email}
                </p>
                <p className="text-slate-600 mt-0.5">
                  {selectedCustomer.phone}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200">
                <p className="text-orange-700 font-bold uppercase">
                  Total Orders Placed
                </p>
                <p className="text-2xl font-extrabold text-navy-900 mt-1">
                  {selectedCustomer.ordersCount} Orders
                </p>
                <p className="text-slate-600">
                  {selectedCustomer.recentOrders?.length || 0} active in current
                  cycle
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <span>
                <strong>Registered Plant Address:</strong>{' '}
                {selectedCustomer.address}
              </span>
            </div>

            {/* Active & Recent Orders Table for this customer */}
            <div>
              <h4 className="text-sm font-bold text-navy-900 mb-2.5">
                Current Cycle Order History ({selectedCustomer.recentOrders?.length || 0})
              </h4>
              {selectedCustomer.recentOrders &&
              selectedCustomer.recentOrders.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold uppercase">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Total Value</th>
                        <th className="p-3">Order Date</th>
                        <th className="p-3">Delivery</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedCustomer.recentOrders.map((ord) => {
                        const totalVal =
                          (Number(ord.quantity) || 0) *
                          (Number(ord.unitPrice) || 150);
                        return (
                          <tr key={ord.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-navy-900">
                              {ord.id}
                            </td>
                            <td className="p-3 font-medium text-slate-800">
                              {ord.productName}
                            </td>
                            <td className="p-3 font-bold text-orange-600">
                              {ord.quantity} pcs
                            </td>
                            <td className="p-3 font-extrabold text-navy-900">
                              ₹{totalVal.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 text-slate-500">{ord.orderDate}</td>
                            <td className="p-3 text-slate-700">
                              {ord.expectedDelivery}
                            </td>
                            <td className="p-3">
                              <StatusBadge status={ord.status} size="xs" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                  All {selectedCustomer.baseOrders} historical orders for this
                  client have been archived and settled.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingCustomer)}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={() => {
          if (deletingCustomer) deleteCustomer(deletingCustomer.id);
        }}
        title={`Remove Customer ${deletingCustomer?.name}?`}
        message={`Are you sure you want to remove ${deletingCustomer?.name} (${deletingCustomer?.company}) from the B2B Customer Directory?`}
      />
    </div>
  );
}
