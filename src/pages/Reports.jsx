import React, { useState, useMemo } from 'react';
import {
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Boxes,
  Users,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

export default function Reports() {
  const {
    orders,
    production,
    inventory,
    customers,
    monthlyOrderTrends,
    addToast,
  } = useApp();

  const [periodFilter, setPeriodFilter] = useState('6m'); // '6m' | 'q3' | 'sep' | 'all'
  const [exportDataset, setExportDataset] = useState('summary'); // 'summary' | 'orders' | 'production' | 'inventory'

  // Filter monthly trends based on selected date range preset
  const filteredTrends = useMemo(() => {
    if (periodFilter === 'sep') return monthlyOrderTrends.slice(-2);
    if (periodFilter === 'q3') return monthlyOrderTrends.slice(-3);
    return monthlyOrderTrends;
  }, [monthlyOrderTrends, periodFilter]);

  // Supervisor Production Performance Data
  const supervisorPerformance = useMemo(() => {
    const map = {};
    production.forEach((p) => {
      if (!map[p.supervisor]) {
        map[p.supervisor] = {
          supervisor: p.supervisor.split(' ')[0],
          fullName: p.supervisor,
          totalBatches: 0,
          totalUnits: 0,
          avgProgress: 0,
          progressSum: 0,
        };
      }
      map[p.supervisor].totalBatches += 1;
      map[p.supervisor].totalUnits += Number(p.quantity) || 0;
      map[p.supervisor].progressSum += Number(p.progress) || 0;
    });
    return Object.values(map).map((item) => ({
      ...item,
      avgProgress: Math.round(item.progressSum / Math.max(1, item.totalBatches)),
    }));
  }, [production]);

  // Inventory Stock Summary by Category
  const inventoryByCategory = useMemo(() => {
    const map = {};
    inventory.forEach((item) => {
      if (!map[item.category]) {
        map[item.category] = {
          category: item.category,
          skuCount: 0,
          totalQuantity: 0,
          lowStockCount: 0,
        };
      }
      map[item.category].skuCount += 1;
      map[item.category].totalQuantity += Number(item.availableQuantity) || 0;
      if (item.stockStatus !== 'In Stock') {
        map[item.category].lowStockCount += 1;
      }
    });
    return Object.values(map);
  }, [inventory]);

  // Completed vs Pending Order Breakdown
  const orderCompletionBreakdown = useMemo(() => {
    const completed = orders.filter(
      (o) => o.status === 'Completed' || o.status === 'Delivered'
    ).length;
    const inProd = orders.filter((o) => o.status === 'In Production').length;
    const pending = orders.filter(
      (o) => o.status === 'Pending' || o.status === 'Confirmed'
    ).length;
    const cancelled = orders.filter((o) => o.status === 'Cancelled').length;

    return [
      { name: 'Completed & Delivered', value: completed, color: '#10b981' },
      { name: 'In Production', value: inProd, color: '#f97316' },
      { name: 'Pending & Confirmed', value: pending, color: '#f59e0b' },
      { name: 'Cancelled', value: cancelled, color: '#ef4444' },
    ].filter((x) => x.value > 0);
  }, [orders]);

  // CSV Download Handler
  const handleDownloadCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `OrderCraft_Report_${exportDataset}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    if (exportDataset === 'orders') {
      headers = [
        'Order ID',
        'Customer Name',
        'Company',
        'Product Name',
        'Quantity',
        'Unit Price (INR)',
        'Total Value (INR)',
        'Order Date',
        'Expected Delivery',
        'Priority',
        'Status',
      ];
      rows = orders.map((o) => [
        o.id,
        o.customerName,
        o.companyName || '',
        o.productName,
        o.quantity,
        Number(o.unitPrice) || 150,
        (Number(o.quantity) || 0) * (Number(o.unitPrice) || 150),
        o.orderDate,
        o.expectedDelivery,
        o.priority,
        o.status,
      ]);
    } else if (exportDataset === 'production') {
      headers = [
        'Production ID',
        'Related Order ID',
        'Product Name',
        'Quantity',
        'Start Date',
        'Expected Completion',
        'Supervisor',
        'Status',
        'Progress %',
      ];
      rows = production.map((p) => [
        p.id,
        p.orderId,
        p.productName,
        p.quantity,
        p.startDate,
        p.expectedCompletion,
        p.supervisor,
        p.status,
        `${p.progress}%`,
      ]);
    } else if (exportDataset === 'inventory') {
      headers = [
        'Item ID',
        'Item Name',
        'Category',
        'Available Qty',
        'Unit',
        'Min Stock Level',
        'Stock Status',
        'Supplier',
      ];
      rows = inventory.map((i) => [
        i.id,
        i.name,
        i.category,
        i.availableQuantity,
        i.unit,
        i.minStockLevel,
        i.stockStatus,
        i.supplier,
      ]);
    } else {
      // Executive Combined Summary Report
      headers = [
        'Section',
        'Record ID / Metric',
        'Name / Description',
        'Primary Value',
        'Status / Secondary KPI',
        'Owner / Partner',
      ];
      rows = [
        ...orders.map((o) => [
          'ORDER',
          o.id,
          o.productName,
          `${o.quantity} units`,
          o.status,
          o.customerName,
        ]),
        ...production.map((p) => [
          'PRODUCTION',
          p.id,
          p.productName,
          `${p.progress}% Complete`,
          p.status,
          p.supervisor,
        ]),
        ...inventory.map((i) => [
          'INVENTORY',
          i.id,
          i.name,
          `${i.availableQuantity} ${i.unit}`,
          i.stockStatus,
          i.supplier,
        ]),
      ];
    }

    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast(
      'CSV Report Downloaded',
      'success',
      `Exported ${filename} (${rows.length} rows).`
    );
  };

  const totalUnitsOrdered = orders.reduce(
    (acc, o) => acc + (Number(o.quantity) || 0),
    0
  );
  const completionRate = Math.round(
    (orders.filter((o) => o.status === 'Completed' || o.status === 'Delivered')
      .length /
      Math.max(1, orders.length)) *
      100
  );

  return (
    <div className="space-y-6">
      {/* Header & CSV Export Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900">
            Manufacturing Performance &amp; Executive Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Analyze monthly order volume, fulfillment rates, supervisor productivity, and inventory valuation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 text-xs font-semibold">
            {[
              { id: '6m', label: 'Last 6 Months' },
              { id: 'q3', label: 'Q3 (Jul–Sep)' },
              { id: 'sep', label: 'Last 60 Days' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodFilter(p.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  periodFilter === p.id
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Dataset Selector + CSV Export Button */}
          <div className="flex items-center gap-2">
            <select
              value={exportDataset}
              onChange={(e) => setExportDataset(e.target.value)}
              aria-label="Select report dataset to export"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-navy-900"
            >
              <option value="summary">Full Executive Report</option>
              <option value="orders">Orders Report Only</option>
              <option value="production">Production Report Only</option>
              <option value="inventory">Inventory Report Only</option>
            </select>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Units Ordered"
          value={totalUnitsOrdered.toLocaleString()}
          subtitle={`Across ${orders.length} manufacturing orders`}
          icon={BarChart3}
          variant="navy"
          trend="+18.2% YoY"
        />
        <StatCard
          title="Order Fulfillment Rate"
          value={`${completionRate}%`}
          subtitle="Completed & delivered vs total"
          icon={CheckCircle2}
          variant="emerald"
          trend="Target: 90%"
        />
        <StatCard
          title="Shop-Floor Efficiency"
          value="91.6%"
          subtitle={`${production.length} scheduled & active runs`}
          icon={TrendingUp}
          variant="orange"
          trend="OEE Class A"
        />
        <StatCard
          title="Warehouse SKUs"
          value={inventory.length}
          subtitle={`${
            inventory.filter((i) => i.stockStatus !== 'In Stock').length
          } items below safety stock`}
          icon={Boxes}
          variant="indigo"
        />
      </div>

      {/* Charts Row 1: Total Orders by Month & Completed vs Pending Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Orders BarChart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-navy-900">
                Total Orders by Month (Completed vs Pending)
              </h3>
              <p className="text-xs text-slate-500">
                Monthly manufacturing order intake compared against completed deliveries
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-orange-500" /> FY 2026
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredTrends}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="orders"
                  name="Total Orders"
                  fill="#0f172a"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="completed"
                  name="Completed Orders"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="pending"
                  name="Pending Backlog"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completed vs Pending Distribution PieChart */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-900">
              Completed vs Pending Orders
            </h3>
            <p className="text-xs text-slate-500">
              Live status split across {orders.length} active customer orders
            </p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderCompletionBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {orderCompletionBreakdown.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
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
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            {orderCompletionBreakdown.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <span className="font-bold text-navy-900">
                  {item.value} ({Math.round((item.value / Math.max(1, orders.length)) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Production Performance by Supervisor & Inventory Stock Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Performance by Supervisor */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-base font-bold text-navy-900">
              Production Performance by Supervisor
            </h3>
            <p className="text-xs text-slate-500">
              Average batch completion percentage and total units managed per supervisor
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={supervisorPerformance}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="supervisor"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="avgProgress"
                  name="Avg Completion %"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="totalBatches"
                  name="Assigned Runs"
                  fill="#0f172a"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Stock Summary Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-900 mb-1">
              Inventory Stock Summary by Category
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Warehouse distribution and safety stock compliance across categories
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="p-3">Category</th>
                    <th className="p-3">Total SKUs</th>
                    <th className="p-3">Available Units</th>
                    <th className="p-3">Alert Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryByCategory.map((cat) => (
                    <tr key={cat.category} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-navy-900">
                        {cat.category}
                      </td>
                      <td className="p-3 text-slate-600">{cat.skuCount} SKUs</td>
                      <td className="p-3 font-bold text-orange-600">
                        {cat.totalQuantity.toLocaleString()} units
                      </td>
                      <td className="p-3">
                        {cat.lowStockCount > 0 ? (
                          <StatusBadge status="Low Stock" size="xs" />
                        ) : (
                          <StatusBadge status="In Stock" size="xs" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Warehouse Categories: {inventoryByCategory.length}</span>
            <span className="font-semibold text-navy-900 flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Ready
              for CSV Audit
            </span>
          </div>
        </div>
      </div>

      {/* Customer Order Statistics Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              Customer Order Statistics (Top B2B Partners)
            </h3>
            <p className="text-xs text-slate-500">
              Enterprise accounts ranked by cumulative manufacturing order count
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...customers]
            .sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0))
            .slice(0, 4)
            .map((cust, index) => (
              <div
                key={cust.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-navy-900 text-orange-400">
                      Rank #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {cust.id}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-navy-900 mt-2.5 truncate">
                    {cust.company}
                  </h4>
                  <p className="text-xs text-slate-500">{cust.name}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Total Contracts</span>
                  <span className="text-sm font-extrabold text-orange-600">
                    {cust.ordersCount} Orders
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
