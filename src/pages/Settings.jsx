import React, { useState } from 'react';
import {
  Building2,
  User,
  Bell,
  Palette,
  RotateCcw,
  LogOut,
  Save,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Settings() {
  const {
    settings,
    updateSettings,
    resetDemoData,
    setIsSessionLocked,
    orders,
    production,
    inventory,
    customers,
  } = useApp();

  const [companyForm, setCompanyForm] = useState(settings.company);
  const [userForm, setUserForm] = useState(settings.user);
  const [notifForm, setNotifForm] = useState(settings.notifications);
  const [appearanceForm, setAppearanceForm] = useState(settings.appearance);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleSaveCompany = (e) => {
    e.preventDefault();
    updateSettings('company', companyForm);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    updateSettings('user', userForm);
  };

  const handleToggleNotification = (key) => {
    const next = { ...notifForm, [key]: !notifForm[key] };
    setNotifForm(next);
    updateSettings('notifications', next);
  };

  const handleToggleAppearance = (key) => {
    const next = { ...appearanceForm, [key]: !appearanceForm[key] };
    setAppearanceForm(next);
    updateSettings('appearance', next);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">
            System Configuration &amp; Plant Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage manufacturing plant details, operator profile, alert rules, UI density, and local demo storage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs sm:text-sm font-bold flex items-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Demo Data
          </button>
          <button
            type="button"
            onClick={() => setIsSessionLocked(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition"
          >
            <LogOut className="w-4 h-4" />
            Logout Session
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 1. Company Profile Information */}
        <form
          onSubmit={handleSaveCompany}
          className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-navy-900 text-orange-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900">
                  Company &amp; Plant Profile
                </h3>
                <p className="text-xs text-slate-500">
                  Enterprise entity details printed on work orders and CSV reports
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Registered Company Name
                </label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Plant Code
                </label>
                <input
                  type="text"
                  value={companyForm.code}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({ ...prev, code: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  GST / Registration Number
                </label>
                <input
                  type="text"
                  value={companyForm.gstNumber}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({
                      ...prev,
                      gstNumber: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Operations Phone
                </label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Operating Shifts
                </label>
                <input
                  type="text"
                  value={companyForm.operatingShifts}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({
                      ...prev,
                      operatingShifts: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Manufacturing Plant Address
                </label>
                <textarea
                  rows={2}
                  value={companyForm.plantAddress}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({
                      ...prev,
                      plantAddress: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-navy-900 hover:bg-orange-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              Save Company Profile
            </button>
          </div>
        </form>

        {/* 2. User Profile Settings */}
        <form
          onSubmit={handleSaveUser}
          className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900">
                  Operator &amp; User Profile Settings
                </h3>
                <p className="text-xs text-slate-500">
                  Updates your active operator badge in the Sidebar and Navbar live
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Role / Designation
                </label>
                <input
                  type="text"
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={userForm.department}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Active Shift Assignment
                </label>
                <input
                  type="text"
                  value={userForm.shift}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, shift: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Direct Mobile
                </label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              Update Operator Profile
            </button>
          </div>
        </form>

        {/* 3. Notification Preferences */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900">
                Notification &amp; Alert Preferences
              </h3>
              <p className="text-xs text-slate-500">
                Configure real-time warehouse and shop-floor alert triggers
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {[
              {
                key: 'lowStockAlerts',
                label: 'Warehouse Low Stock & Out-of-Stock Alerts',
                desc: 'Notify immediately when an SKU drops below its safety threshold.',
              },
              {
                key: 'orderStatusUpdates',
                label: 'Customer Order Pipeline Transitions',
                desc: 'Show toast & bell alerts when orders change status.',
              },
              {
                key: 'productionDelays',
                label: 'Shop-Floor Production Milestone Notifications',
                desc: 'Alert when a production batch starts or reaches 100% completion.',
              },
              {
                key: 'dailyShiftDigest',
                label: 'Automated Shift Handover Summary',
                desc: 'Compile OEE and dispatch metrics at the end of each shift.',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="py-3.5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-bold text-navy-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification(item.key)}
                  role="switch"
                  aria-checked={Boolean(notifForm[item.key])}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    notifForm[item.key] ? 'bg-orange-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform ${
                      notifForm[item.key] ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Appearance Preferences & LocalStorage Demo State */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900">
                  Appearance &amp; Demo Data Persistence
                </h3>
                <p className="text-xs text-slate-500">
                  Customize workspace density and inspect local browser storage
                </p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {[
                {
                  key: 'compactTables',
                  label: 'Compact ERP Table Density',
                  desc: 'Reduce vertical padding in Orders, Production, and Inventory tables.',
                },
                {
                  key: 'highContrastBadges',
                  label: 'High-Contrast Status Indicators',
                  desc: 'Show pulsing status dots on Urgent and In-Production records.',
                },
                {
                  key: 'animateCharts',
                  label: 'Smooth Recharts Transitions',
                  desc: 'Enable animated transitions on Dashboard and Reports charts.',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-bold text-navy-900">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleAppearance(item.key)}
                    role="switch"
                    aria-checked={Boolean(appearanceForm[item.key])}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      appearanceForm[item.key] ? 'bg-navy-900' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform ${
                        appearanceForm[item.key] ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Backend API & Database Telemetry Box */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-navy-900">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-orange-500" />
                Express.js + MongoDB Database Engine
              </span>
              <span className="text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Connected (localhost:5000)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Persisting <strong>{orders.length} Orders</strong>,{' '}
              <strong>{production.length} Production Runs</strong>,{' '}
              <strong>{inventory.length} Inventory Items</strong>, and{' '}
              <strong>{customers.length} Customers</strong> in the OrderCraft database (`server/data/ordercraft_db.json` &amp; MongoDB).
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Reset Demo Data Dialog */}
      <ConfirmDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={resetDemoData}
        variant="warning"
        title="Reset All Demo Data to Factory Defaults?"
        message="This will clear any custom orders, production progress updates, inventory changes, or customers stored in localStorage and restore the original OrderCraft academic demo dataset."
        confirmText="Reset Demo Data"
      />
    </div>
  );
}
