import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Calendar,
  ChevronRight,
  ChevronDown,
  User,
  Settings,
  RotateCcw,
  LogOut,
  ShoppingCart,
  Factory,
  Boxes,
  Users,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const ROUTE_META = {
  '/': { title: 'Manufacturing Dashboard', crumb: 'Overview & Live Telemetry' },
  '/orders': { title: 'Order Management', crumb: 'Customer Orders & Dispatch' },
  '/production': { title: 'Production Control', crumb: 'Shop Floor & Work Centers' },
  '/inventory': { title: 'Inventory & Warehouse', crumb: 'Raw Materials & Finished Stock' },
  '/customers': { title: 'Customer Directory', crumb: 'B2B Accounts & Order History' },
  '/reports': { title: 'Manufacturing Analytics', crumb: 'KPI Reports & CSV Exports' },
  '/settings': { title: 'System Settings', crumb: 'Plant Profile & Preferences' },
};

export default function Navbar({ onOpenSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    orders,
    production,
    inventory,
    customers,
    settings,
    notifications,
    markAllNotificationsRead,
    resetDemoData,
    setIsSessionLocked,
  } = useApp();

  const [globalQuery, setGlobalQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const currentMeta = ROUTE_META[location.pathname] || {
    title: 'OrderCraft ERP',
    crumb: 'Operations',
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search results across modules
  const q = globalQuery.trim().toLowerCase();
  const matchedOrders = q
    ? orders
        .filter(
          (o) =>
            o.id.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.productName.toLowerCase().includes(q)
        )
        .slice(0, 3)
    : [];

  const matchedProduction = q
    ? production
        .filter(
          (p) =>
            p.id.toLowerCase().includes(q) ||
            p.productName.toLowerCase().includes(q) ||
            p.supervisor.toLowerCase().includes(q)
        )
        .slice(0, 2)
    : [];

  const matchedInventory = q
    ? inventory
        .filter(
          (i) =>
            i.id.toLowerCase().includes(q) ||
            i.name.toLowerCase().includes(q) ||
            i.supplier.toLowerCase().includes(q)
        )
        .slice(0, 2)
    : [];

  const matchedCustomers = q
    ? customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q)
        )
        .slice(0, 2)
    : [];

  const totalMatches =
    matchedOrders.length +
    matchedProduction.length +
    matchedInventory.length +
    matchedCustomers.length;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const initials = (settings?.user?.name || 'Aarav Deshmukh')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Trigger + Page Title & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <span>OrderCraft</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-orange-600 font-semibold truncate">
              {currentMeta.crumb}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-extrabold text-navy-900 truncate leading-tight">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div ref={searchRef} className="relative hidden md:block w-full max-w-xs lg:max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={globalQuery}
          onFocus={() => setShowSearchDropdown(true)}
          onChange={(e) => {
            setGlobalQuery(e.target.value);
            setShowSearchDropdown(true);
          }}
          placeholder="Search orders, production IDs, SKUs, clients..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 border border-slate-200/90 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition"
        />

        {/* Instant Global Search Results Popover */}
        {showSearchDropdown && q.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
            {totalMatches === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No records matching "<span className="font-semibold text-slate-700">{globalQuery}</span>"
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {matchedOrders.length > 0 && (
                  <div className="p-2.5">
                    <p className="px-2 pb-1 text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3 text-orange-500" /> Orders
                    </p>
                    {matchedOrders.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          navigate('/orders');
                          setShowSearchDropdown(false);
                          setGlobalQuery('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold text-navy-900 truncate">
                          {o.id} — {o.productName}
                        </span>
                        <span className="text-slate-400 shrink-0">{o.customerName}</span>
                      </button>
                    ))}
                  </div>
                )}

                {matchedProduction.length > 0 && (
                  <div className="p-2.5">
                    <p className="px-2 pb-1 text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Factory className="w-3 h-3 text-sky-500" /> Production
                    </p>
                    {matchedProduction.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          navigate('/production');
                          setShowSearchDropdown(false);
                          setGlobalQuery('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold text-navy-900 truncate">
                          {p.id} — {p.productName}
                        </span>
                        <span className="text-orange-600 font-semibold shrink-0">
                          {p.progress}%
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {matchedInventory.length > 0 && (
                  <div className="p-2.5">
                    <p className="px-2 pb-1 text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Boxes className="w-3 h-3 text-emerald-500" /> Inventory
                    </p>
                    {matchedInventory.map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => {
                          navigate('/inventory');
                          setShowSearchDropdown(false);
                          setGlobalQuery('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold text-navy-900 truncate">
                          {i.id} — {i.name}
                        </span>
                        <span className="text-slate-500 shrink-0">
                          {i.availableQuantity} {i.unit}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {matchedCustomers.length > 0 && (
                  <div className="p-2.5">
                    <p className="px-2 pb-1 text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-500" /> Customers
                    </p>
                    {matchedCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          navigate('/customers');
                          setShowSearchDropdown(false);
                          setGlobalQuery('');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold text-navy-900 truncate">
                          {c.name}
                        </span>
                        <span className="text-slate-400 truncate">{c.company}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Date Display, Notifications, User Profile Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Date Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-orange-500" />
          <span>{formattedDate}</span>
        </div>

        {/* Notifications Bell Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setShowNotifDropdown((v) => !v)}
            className="relative p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-navy-900 transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 bg-navy-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Plant Alert Center
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {unreadCount} unread operational notifications
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    All systems nominal. No active alerts.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        navigate(n.link || '/');
                        setShowNotifDropdown(false);
                      }}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition flex items-start gap-3 ${
                        !n.read ? 'bg-orange-50/30' : ''
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'critical'
                            ? 'bg-rose-500'
                            : n.type === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-orange-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-navy-900 truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => setShowUserDropdown((v) => !v)}
            className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-navy-900 text-orange-400 font-bold text-xs flex items-center justify-center">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-navy-900 leading-none">
                {settings?.user?.name || 'Aarav Deshmukh'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-none">
                {settings?.user?.department || 'Plant Operations'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-bold text-navy-900">{settings?.user?.name}</p>
                <p className="text-slate-500 truncate mt-0.5">{settings?.user?.email}</p>
              </div>

              <Link
                to="/settings"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
              >
                <User className="w-4 h-4 text-slate-400" />
                User Profile Settings
              </Link>

              <Link
                to="/settings"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Plant Configuration
              </Link>

              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  setShowUserDropdown(false);
                }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-amber-700 hover:bg-amber-50 font-medium"
              >
                <RotateCcw className="w-4 h-4 text-amber-500" />
                Reset Demo Data
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => {
                  setIsSessionLocked(true);
                  setShowUserDropdown(false);
                }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 font-semibold"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Lock / Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
