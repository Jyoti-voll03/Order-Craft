import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart,
  Clock,
  Factory,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  PackagePlus,
  TrendingUp,
  Layers,
  Wrench,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

const DOUGHNUT_COLORS = {
  'In Progress': '#f97316',
  Scheduled: '#64748b',
  'Quality Check': '#6366f1',
  Completed: '#10b981',
  Paused: '#f59e0b',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    orders,
    production,
    inventory,
    monthlyOrderTrends,
    adjustInventoryStock,
  } = useApp();

  // Compute KPI counts dynamically
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'Confirmed').length;
  const activeProduction = production.filter(
    (p) => p.status === 'In Progress' || p.status === 'Quality Check'
  ).length;
  const completedOrders = orders.filter(
    (o) => o.status === 'Completed' || o.status === 'Delivered'
  ).length;
  const lowStockItems = inventory.filter(
    (i) => i.stockStatus === 'Low Stock' || i.stockStatus === 'Out of Stock'
  );

  // Production status distribution for Doughnut Chart
  const productionDistribution = useMemo(() => {
    const counts = {
      'In Progress': 0,
      Scheduled: 0,
      'Quality Check': 0,
      Completed: 0,
      Paused: 0,
    };
    production.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: DOUGHNUT_COLORS[name] || '#0f172a',
      }));
  }, [production]);

  const recentOrders = orders.slice(0, 6);
  const recentProduction = production.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Action Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[11px] font-bold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" /> Live Manufacturing Telemetry
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold mt-2 tracking-tight">
            Centralized Plant Operations Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Monitor customer orders, active shop-floor batches, raw material inventory thresholds, and dispatch readiness in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/25 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            New Customer Order
          </button>
          <button
            type="button"
            onClick={() => navigate('/production')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
          >
            <Wrench className="w-4 h-4 text-orange-400" />
            Shop Floor Schedule
          </button>
        </div>
      </div>

      {/* 5 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Orders"
          value={totalOrders}
          subtitle="All active & historical orders"
          icon={ShoppingCart}
          variant="navy"
          trend="+14% MTD"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrders}
          subtitle="Awaiting production release"
          icon={Clock}
          variant="amber"
          trend={`${orders.filter((o) => o.priority === 'Urgent').length} Urgent`}
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Active Production"
          value={activeProduction}
          subtitle="Batches on shop floor"
          icon={Factory}
          variant="orange"
          trend={`${production.length} Total Runs`}
          onClick={() => navigate('/production')}
        />
        <StatCard
          title="Completed Orders"
          value={completedOrders}
          subtitle="Finished & delivered batches"
          icon={CheckCircle2}
          variant="emerald"
          trend="96.4% On-Time"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockItems.length}
          subtitle="Below minimum threshold"
          icon={AlertTriangle}
          variant="rose"
          trend={
            lowStockItems.some((i) => i.stockStatus === 'Out of Stock')
              ? 'Action Needed'
              : 'Monitor'
          }
          onClick={() => navigate('/inventory')}
        />
      </div>

      {/* Charts Row: Monthly Order Trends (Line Chart) & Production Status Distribution (Doughnut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Monthly Order Trends */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="text-base font-bold text-navy-900">
                Monthly Order &amp; Fulfillment Trends
              </h3>
              <p className="text-xs text-slate-500">
                6-month comparison of total received orders vs completed dispatches
              </p>
            </div>
            <Link
              to="/reports"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
            >
              Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyOrderTrends}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="orders"
                  name="Total Orders Received"
                  stroke="#0f172a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0f172a' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed & Dispatched"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f97316' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Plant Capacity Target"
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Chart: Production Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-900">
              Production Status Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Breakdown of {production.length} active &amp; scheduled manufacturing runs
            </p>
          </div>

          <div className="h-56 w-full relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productionDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={82}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {productionDistribution.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center KPI Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-navy-900">
                {production.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Batches
              </span>
            </div>
          </div>

          {/* Custom Legend List */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            {productionDistribution.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy-900">{item.value}</span>
                  <span className="text-slate-400 w-10 text-right">
                    {Math.round((item.value / Math.max(1, production.length)) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Orders Table + Recent Production Activities + Inventory Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders Table (2 Columns wide on XL) */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-900">
                Recent Customer Orders
              </h3>
              <p className="text-xs text-slate-500">
                Latest incoming production orders and delivery schedules
              </p>
            </div>
            <Link
              to="/orders"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-navy-900 text-xs font-semibold transition inline-flex items-center gap-1"
            >
              View All ({orders.length}) <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer &amp; Product</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Total Value</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {recentOrders.map((order) => {
                  const totalVal =
                    (Number(order.quantity) || 0) *
                    (Number(order.unitPrice) || 150);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate('/orders')}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 font-bold text-navy-900 whitespace-nowrap">
                        {order.id}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 truncate max-w-[220px]">
                          {order.productName}
                        </p>
                        <p className="text-xs text-slate-500">{order.customerName}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                        {order.quantity} pcs
                      </td>
                      <td className="px-4 py-3 font-bold text-navy-900 whitespace-nowrap">
                        ₹{totalVal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.priority} size="xs" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} size="xs" />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {order.expectedDelivery}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Recent Production Activities + Inventory Alerts */}
        <div className="space-y-6">
          {/* Recent Production Activities */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-500" />
                  Recent Production Activity
                </h3>
                <p className="text-xs text-slate-500">Live shop-floor work center progress</p>
              </div>
              <Link
                to="/production"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-3.5">
              {recentProduction.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-navy-900">
                      {prod.id} • {prod.productName}
                    </span>
                    <StatusBadge status={prod.status} size="xs" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Sup: {prod.supervisor}</span>
                    <span className="font-bold text-navy-900">{prod.progress}%</span>
                  </div>
                  <div className="mt-2 w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        prod.progress === 100
                          ? 'bg-emerald-500'
                          : prod.progress >= 75
                          ? 'bg-indigo-500'
                          : 'bg-orange-500'
                      }`}
                      style={{ width: `${prod.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Alerts Section */}
          <div className="bg-white rounded-xl border border-rose-200/90 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900">
                    Critical Inventory Alerts
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lowStockItems.length} items below safety stock level
                  </p>
                </div>
              </div>
              <Link
                to="/inventory"
                className="text-xs font-semibold text-orange-600 hover:underline"
              >
                Inventory
              </Link>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium text-center">
                All warehouse items are above minimum stock levels!
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-rose-50/40 border border-rose-200/70 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-navy-900 truncate">
                          {item.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Available:{' '}
                        <span className="font-bold text-rose-600">
                          {item.availableQuantity} {item.unit}
                        </span>{' '}
                        (Min: {item.minStockLevel})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => adjustInventoryStock(item.id, 50)}
                      title="Quick Restock +50 units"
                      className="px-2.5 py-1.5 rounded-lg bg-navy-900 hover:bg-orange-500 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 transition shadow-xs"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      +50
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
