import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Factory,
  Boxes,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar({ isOpen, onClose }) {
  const { orders, production, inventory, settings, setIsSessionLocked, addToast } = useApp();

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'In Production'
  ).length;

  const activeProdCount = production.filter(
    (p) => p.status === 'In Progress' || p.status === 'Quality Check'
  ).length;

  const lowStockCount = inventory.filter(
    (i) => i.stockStatus === 'Low Stock' || i.stockStatus === 'Out of Stock'
  ).length;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    {
      name: 'Orders',
      path: '/orders',
      icon: ShoppingCart,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeColor: 'bg-orange-500 text-white',
    },
    {
      name: 'Production',
      path: '/production',
      icon: Factory,
      badge: activeProdCount > 0 ? activeProdCount : null,
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    },
    {
      name: 'Inventory',
      path: '/inventory',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} Alert` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    setIsSessionLocked(true);
    addToast('Operator Session Locked', 'info', 'Click Sign In to resume your session.');
    if (onClose) onClose();
  };

  const initials = (settings?.user?.name || 'Aarav Deshmukh')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-navy-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/25">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Order<span className="text-orange-500">Craft</span>
                </span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-orange-400 border border-slate-700">
                  ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none mt-0.5">
                Manufacturing Suite
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations Control
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => {
                  if (window.innerWidth < 1024 && onClose) onClose();
                }}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Plant Live Status Widget */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 px-2">
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Plant Status
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {settings?.company?.code || 'OC-MFG-IND-01'} •{' '}
                {settings?.user?.shift?.split(' ')[0] || 'Shift'} Active
              </p>
              <div className="mt-2.5 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-400 to-orange-400 h-full w-[88%] rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>OEE Efficiency</span>
                <span className="text-white font-semibold">88.4%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom User Profile & Logout */}
        <div className="p-3.5 border-t border-slate-800 bg-navy-950/50 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {settings?.user?.name || 'Aarav Deshmukh'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {settings?.user?.role || 'VP of Operations'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Lock / Logout Session"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
