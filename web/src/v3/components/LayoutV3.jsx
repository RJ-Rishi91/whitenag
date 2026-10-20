import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useSyncStore } from '../../store/useSyncStore.js';
import { api } from '../../api/client.js';

export function LayoutV3({ onSwitchVersion }) {
  const { user, logout } = useAuthStore();
  const { pendingCount, setSyncStatus } = useSyncStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTallyOnline, setIsTallyOnline] = useState(true);

  // Poll sync overview
  useEffect(() => {
    async function checkSync() {
      try {
        const res = await api.get('/sync/overview');
        if (res.success) {
          setIsTallyOnline(res.connector?.isOnline ?? true);
          setSyncStatus({
            connectorOnline: res.connector?.isOnline ?? true,
            pendingCount: res.counts?.pending ?? 0,
            failedCount: res.counts?.failed ?? 0,
            conflictCount: res.counts?.conflict ?? 0,
            lastSyncedAt: res.lastSyncedAt
          });
        }
      } catch {
        // silent
      }
    }
    checkSync();
    const t = setInterval(checkSync, 15000);
    return () => clearInterval(t);
  }, [setSyncStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navSections = [
    {
      group: 'Core',
      items: [
        { to: '/v3', label: 'Dashboard', icon: 'grid_view', end: true },
        { to: '/v3/orders', label: 'Orders & Sales', icon: 'shopping_bag' },
        { to: '/v3/orders/new', label: 'New Order Entry', icon: 'add_circle' },
        { to: '/v3/delivery', label: 'Dispatch & Fleet', icon: 'local_shipping' }
      ]
    },
    {
      group: 'Operations',
      items: [
        { to: '/stock', label: 'Stock & Godowns', icon: 'inventory_2' },
        { to: '/v3/production', label: 'Production & BOM', icon: 'precision_manufacturing' },
        { to: '/purchases', label: 'Raw Purchases', icon: 'shopping_cart' },
        { to: '/customers', label: 'Party Ledgers', icon: 'storefront' }
      ]
    },
    {
      group: 'Finance & Integration',
      items: [
        { to: '/v3/invoices', label: 'Invoices & Billing', icon: 'receipt_long' },
        { to: '/payments', label: 'Payments & Cash', icon: 'payments' },
        { to: '/reports', label: 'Reports & P&L', icon: 'insights' },
        { to: '/v3/sync', label: 'TallyPrime Hub', icon: 'sync_alt' },
        { to: '/settings', label: 'Settings', icon: 'tune' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col">
      {/* SIDEBAR (Desktop) */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0F172A] text-slate-300 z-50 hidden md:flex flex-col justify-between border-r border-slate-800 shadow-xl">
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-[#0B1120]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F59E0B] flex items-center justify-center font-bold text-white text-base shadow-sm">
                NF
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[14px] text-white tracking-tight leading-snug">
                  Nagfani Foods
                </span>
                <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                  ERP 3.0 Enterprise
                </span>
              </div>
            </div>
          </div>

          {/* Version Switcher Strip */}
          <div className="px-3.5 pt-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                v3.0 Pro Active
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSwitchVersion('v1')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                  title="Switch to Classic v1.0"
                >
                  v1
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchVersion('v2')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                  title="Switch to Stitch v2.0"
                >
                  v2
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
            <nav className="space-y-4">
              {navSections.map((sec) => (
                <div key={sec.group} className="space-y-0.5">
                  <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {sec.group}
                  </div>
                  {sec.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                          isActive
                            ? 'bg-[#EA580C] text-white shadow-sm font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`
                      }
                    >
                      <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* User Station Footer */}
        <div className="p-3 bg-[#0B1120] border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60 transition-colors">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs border border-slate-600">
                {(user?.name || user?.fullName || 'R').charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0B1120]"></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-white truncate">
                {user?.name || user?.fullName || 'Rushal'}
              </div>
              <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                <span>Savina Main Mandi</span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* TOP HEADER */}
      <div className="md:pl-64 flex flex-col flex-1">
        <header className="sticky top-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            {/* Quick Search */}
            <form onSubmit={handleSearch} className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, parties, vouchers (Ctrl+K)..."
                className="w-full h-9 pl-9 pr-12 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white transition-all font-sans"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                ⌘K
              </span>
            </form>

            {/* Godown Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
              <span className="material-symbols-outlined text-[16px] text-slate-500">warehouse</span>
              <span>Savina Mandi (Godown A)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tally Connectivity Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>TallyPrime Live (ODBC)</span>
            </div>

            {/* 3-Way Version Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => onSwitchVersion('v1')}
                className="px-2 py-1 rounded text-slate-600 hover:text-slate-900 transition-colors"
                title="Switch to Classic v1.0"
              >
                v1.0
              </button>
              <button
                type="button"
                onClick={() => onSwitchVersion('v2')}
                className="px-2 py-1 rounded text-slate-600 hover:text-slate-900 transition-colors"
                title="Switch to Stitch v2.0"
              >
                v2.0
              </button>
              <button
                type="button"
                onClick={() => onSwitchVersion('v3')}
                className="px-2.5 py-1 rounded bg-white text-[#EA580C] font-bold shadow-xs border border-slate-200"
              >
                v3.0 Pro ✨
              </button>
            </div>

            {/* Quick Action */}
            <button
              onClick={() => navigate('/v3/orders/new')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] active:scale-[0.98] text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span className="hidden sm:inline">New Order</span>
            </button>
          </div>
        </header>

        {/* Mobile Flyout Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-[#0F172A] text-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EA580C] flex items-center justify-center font-bold text-white text-sm">
                    NF
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Nagfani Foods</div>
                    <div className="text-[11px] text-slate-400">Enterprise v3.0</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-white"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="py-4 space-y-4">
                {navSections.map((sec) => (
                  <div key={sec.group} className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                      {sec.group}
                    </div>
                    {sec.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-medium"
                      >
                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  onSwitchVersion('v1');
                  setMobileMenuOpen(false);
                }}
                className="text-xs px-3 py-1.5 rounded bg-slate-800 text-slate-300"
              >
                Switch to v1.0
              </button>
              <button
                onClick={logout}
                className="text-xs px-3 py-1.5 rounded bg-rose-600/80 text-white font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 bg-[#F8FAFC]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
