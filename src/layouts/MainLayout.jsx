import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Factory, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ToastContainer from '../components/ToastContainer';
import { useApp } from '../context/AppContext';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isSessionLocked, setIsSessionLocked, settings, addToast } = useApp();

  const handleUnlockSession = (e) => {
    e.preventDefault();
    setIsSessionLocked(false);
    addToast('Welcome back to OrderCraft', 'success', `Signed in as ${settings?.user?.name}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Wrapper */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>

        {/* Subtle ERP Footer */}
        <footer className="px-6 py-4 border-t border-slate-200/80 bg-white/60 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-navy-900">OrderCraft ERP v2.4</span> — Manufacturing Order &amp; Management System
          </div>
          <div className="flex items-center gap-4">
            <span>Plant ID: {settings?.company?.code || 'OC-MFG-IND-01'}</span>
            <span className="text-emerald-600 font-semibold">● LocalStorage Sync Active</span>
          </div>
        </footer>
      </div>

      {/* Toast Notification Stack */}
      <ToastContainer />

      {/* Interactive Demo Session Lock / Logout Overlay */}
      {isSessionLocked && (
        <div className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-modal">
            <div className="p-6 bg-navy-900 text-white text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/25">
                <Factory className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">
                Order<span className="text-orange-500">Craft</span> Terminal
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Manufacturing Operations Session Locked
              </p>
            </div>

            <form onSubmit={handleUnlockSession} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy-900 text-orange-400 font-bold text-sm flex items-center justify-center shrink-0">
                  {(settings?.user?.name || 'AD')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-navy-900 truncate">
                    {settings?.user?.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {settings?.user?.role} • {settings?.user?.employeeId}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Operator PIN / Passkey (Demo Mode)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    defaultValue="2026"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                    placeholder="Enter operator PIN"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Frontend-only academic demo session — click below to unlock immediately.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition"
              >
                <span>Resume Operator Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
