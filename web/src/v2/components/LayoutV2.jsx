import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useSyncStore } from '../../store/useSyncStore.js';
import { api } from '../../api/client.js';
import { getSocket } from '../../api/socket.js';

export function LayoutV2({ onSwitchVersion }) {
  const { user, logout } = useAuthStore();
  const { pendingCount, setSyncStatus } = useSyncStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncedTodayCount, setSyncedTodayCount] = useState(148);

  // Fetch sync overview
  useEffect(() => {
    async function fetchSyncStatus() {
      try {
        const res = await api.get('/sync/overview');
        if (res.success) {
          setSyncStatus({
            connectorOnline: res.connector?.isOnline ?? true,
            pendingCount: res.counts?.pending ?? 0,
            failedCount: res.counts?.failed ?? 0,
            conflictCount: res.counts?.conflict ?? 1,
            company: res.connector?.company ?? 'Nagfani Foods Pvt Ltd',
            lastSyncedAt: res.lastSyncedAt
          });
          if (res.counts?.syncedToday) {
            setSyncedTodayCount(res.counts.syncedToday);
          }
        }
      } catch (err) {
        // silence
      }
    }

    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 15000);
    return () => clearInterval(interval);
  }, [setSyncStatus]);

  // Connect socket for real-time live events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('sync:status', () => {
      api.get('/sync/overview').then(res => {
        if (res.success) {
          setSyncStatus({
            pendingCount: res.counts?.pending ?? 0,
            failedCount: res.counts?.failed ?? 0,
            conflictCount: res.counts?.conflict ?? 0
          });
        }
      });
    });

    return () => {
      socket.off('sync:status');
    };
  }, [setSyncStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navGroups = [
    {
      title: 'Main',
      links: [
        { to: '/v2', label: 'Dashboard', icon: 'grid_view', end: true },
        { to: '/v2/orders', label: 'Orders', icon: 'receipt_long' },
        { to: '/customers', label: 'Customers', icon: 'group' }
      ]
    },
    {
      title: 'Operations',
      links: [
        { to: '/v2/delivery', label: 'Delivery', icon: 'local_shipping' },
        { to: '/stock', label: 'Stock & Godown', icon: 'warehouse' },
        { to: '/purchases', label: 'Purchase', icon: 'shopping_cart' },
        { to: '/v2/manufacturing', label: 'Manufacturing & BOM', icon: 'precision_manufacturing' }
      ]
    },
    {
      title: 'Finance & System',
      links: [
        { to: '/invoices', label: 'Invoices & Billing', icon: 'request_quote' },
        { to: '/payments', label: 'Payments & Cash', icon: 'account_balance_wallet' },
        { to: '/reports', label: 'Reports', icon: 'bar_chart' },
        { to: '/sync', label: 'Tally Sync', icon: 'sync_alt' },
        { to: '/settings', label: 'Settings', icon: 'settings' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFF7EE] text-[#1E2B2D] font-inter antialiased flex flex-col">
      {/* Sidebar Desktop */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#03353A] text-[#E5F3F6] z-50 hidden md:flex flex-col justify-between shadow-[0_16px_36px_-8px_rgba(3,53,58,0.18)]">
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Brand Logo Header */}
          <div className="h-16 px-4 flex items-center gap-3 bg-[#02272B] border-b border-[#04444a]/40">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D9580B] to-[#E8A317] flex items-center justify-center font-outfit font-extrabold text-white text-lg shadow-sm">
              NF
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-outfit font-bold text-[15px] tracking-wide text-white truncate">
                NAGFANI FOODS
              </span>
              <span className="text-[11px] font-semibold text-[#A3CED4] tracking-widest uppercase">
                Udaipur ERP 2.0
              </span>
            </div>
          </div>

          {/* Version 2.0 Banner Pill */}
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#06484F]/80 border border-[#A3CED4]/20 text-[11px]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#FFF7EE]">
                <span className="w-2 h-2 rounded-full bg-[#E8A317] animate-pulse"></span>
                v2.0 Active
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onSwitchVersion('v1')}
                  className="text-[10px] font-semibold text-[#BFEAF0] hover:text-white bg-[#02272B] px-1.5 py-0.5 rounded transition-colors border border-white/10"
                  title="Switch to Classic v1.0"
                >
                  v1
                </button>
                <button
                  onClick={() => onSwitchVersion('v3')}
                  className="text-[10px] font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] px-1.5 py-0.5 rounded transition-colors shadow-xs"
                  title="Switch to Clean Enterprise v3.0 Pro"
                >
                  v3 ✨
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
            <nav className="space-y-4">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <div className="px-3 pb-1 text-[11px] font-bold text-[#A3CED4] uppercase tracking-wider">
                    {group.title}
                  </div>
                  {group.links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-[13.5px] ${
                          isActive
                            ? 'bg-[#D9580B] text-white font-semibold shadow-md shadow-[#D9580B]/20'
                            : 'text-[#BFEAF0] hover:bg-[#06484F] hover:text-white font-medium'
                        }`
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                      <span>{link.label}</span>
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* User Card & Godown Station */}
        <div className="p-3 bg-[#02272B] border-t border-[#04444a]/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#03353A] hover:bg-[#06484F] transition-colors">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#D9580B] text-white flex items-center justify-center font-outfit font-bold text-sm shadow-sm">
                {(user?.name || user?.fullName || 'Rushal').charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#03353A]"></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-white truncate">
                  {user?.name || user?.fullName || 'Rushal'}
                </span>
                <span className="text-[11px] text-[#A3CED4] font-medium capitalize">
                  {user?.role?.name || user?.role?.code || (typeof user?.role === 'string' ? user?.role : 'Admin')}
                </span>
              </div>
              <div className="text-[11px] text-[#A3CED4] truncate flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">location_on</span>
                <span>Savina Main Mandi</span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1 rounded-lg hover:bg-[#02272B] text-[#A3CED4] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Top Header */}
      <div className="md:pl-64 flex flex-col flex-1">
        <header className="sticky top-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-b border-[#EADBC8]/70 shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-40 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-[#FFF7EE] text-[#03353A]"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            {/* Quick Search */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7166] text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-16 bg-[#FFF7EE] text-[#1E2B2D] placeholder-[#8C7166] text-[13px] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9580B] border border-[#EADBC8]/50 transition-all font-inter"
                placeholder="Search orders, parties, items..."
                type="text"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-[#8C7166] border border-[#EADBC8]/60 shadow-xs">
                Ctrl+K
              </span>
            </form>

            {/* Godown Selector */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFF7EE] hover:bg-[#F6EDE0] cursor-pointer transition-colors border border-[#EADBC8]/50">
              <span className="material-symbols-outlined text-[18px] text-[#03353A]">store</span>
              <span className="text-[13px] font-medium text-[#1E2B2D]">Savina Mandi (Godown A)</span>
              <span className="material-symbols-outlined text-[16px] text-[#8C7166]">expand_more</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Tally ODBC Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-[12px] font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Synced ({syncedTodayCount} today)</span>
            </div>

            {/* Switch Version Toggle Button */}
            <div className="flex items-center bg-[#FFF7EE] p-1 rounded-xl border border-[#EADBC8] text-[11px] font-semibold">
              <button
                onClick={() => onSwitchVersion('v1')}
                className="px-2 py-1 text-[#8C7166] hover:text-[#1E2B2D] rounded-lg transition-colors"
                title="Switch to Classic v1.0"
              >
                v1.0
              </button>
              <button
                onClick={() => onSwitchVersion('v2')}
                className="px-2 py-1 font-bold text-white bg-[#03353A] rounded-lg shadow-xs"
              >
                v2.0
              </button>
              <button
                onClick={() => onSwitchVersion('v3')}
                className="px-2.5 py-1 font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-lg shadow-xs transition-colors ml-0.5"
                title="Switch to Clean Enterprise v3.0 Pro"
              >
                v3.0 Pro ✨
              </button>
            </div>

            {/* + New Order Action */}
            <button
              onClick={() => navigate('/v2/orders/new')}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-[#D9580B] hover:bg-[#BF4B07] active:scale-[0.98] text-white font-semibold text-[13px] rounded-xl transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="hidden sm:inline">New Order</span>
            </button>

            {/* Header Icon Actions */}
            <div className="flex items-center gap-1 text-[#03353A]">
              <button
                onClick={() => navigate('/v2/delivery')}
                className="w-9 h-9 rounded-xl hover:bg-[#FFF7EE] flex items-center justify-center transition-colors relative"
                title="Active Dispatches"
              >
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D9580B]"></span>
              </button>
              <button
                onClick={() => navigate('/sync')}
                className="w-9 h-9 rounded-xl hover:bg-[#FFF7EE] flex items-center justify-center transition-colors"
                title="Tally Sync Connector"
              >
                <span className="material-symbols-outlined text-[20px]">sync</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Flyout Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-[#03353A] text-[#E5F3F6] p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[#06484F]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D9580B] flex items-center justify-center font-bold text-white">
                    NF
                  </div>
                  <div>
                    <div className="font-outfit font-bold text-white">NAGFANI FOODS</div>
                    <div className="text-[11px] text-[#A3CED4]">Executive ERP 2.0</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-[#02272B] text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="py-4 space-y-4">
                {navGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <div className="text-[11px] font-bold text-[#A3CED4] uppercase tracking-wider py-1">
                      {group.title}
                    </div>
                    {group.links.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#BFEAF0] hover:bg-[#06484F] hover:text-white"
                      >
                        <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                        <span>{link.label}</span>
                      </NavLink>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#06484F] flex items-center justify-between">
              <button
                onClick={() => {
                  onSwitchVersion('v1');
                  setMobileMenuOpen(false);
                }}
                className="text-xs px-3 py-2 bg-[#02272B] rounded-xl text-white"
              >
                Switch to Classic v1.0
              </button>
              <button
                onClick={logout}
                className="text-xs px-3 py-2 bg-red-600/80 rounded-xl text-white"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 bg-[#FFF7EE]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
