import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Truck,
  Boxes,
  ShoppingBag,
  Factory,
  Receipt,
  CreditCard,
  BarChart3,
  RefreshCw,
  Settings,
  Search,
  LogOut,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSyncStore } from '../store/useSyncStore.js';
import { SyncChip } from './SyncChip.jsx';
import { api } from '../api/client.js';
import { getSocket } from '../api/socket.js';

export function Layout() {
  const { user, logout } = useAuthStore();
  const { pendingCount, setSyncStatus } = useSyncStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch sync overview
  useEffect(() => {
    async function fetchSyncStatus() {
      try {
        const res = await api.get('/sync/overview');
        if (res.success) {
          setSyncStatus({
            connectorOnline: res.connector.isOnline,
            pendingCount: res.counts.pending,
            failedCount: res.counts.failed,
            conflictCount: res.counts.conflict,
            company: res.connector.company,
            lastSyncedAt: res.lastSyncedAt
          });
        }
      } catch (err) {
        // quiet ignore
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
            pendingCount: res.counts.pending,
            failedCount: res.counts.failed,
            conflictCount: res.counts.conflict
          });
        }
      });
    });

    return () => {
      socket.off('sync:status');
    };
  }, [setSyncStatus]);

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/delivery', label: 'Delivery', icon: Truck },
    { to: '/stock', label: 'Stock & Inventory', icon: Boxes },
    { to: '/purchases', label: 'Purchase', icon: ShoppingBag },
    { to: '/manufacturing', label: 'Manufacturing', icon: Factory },
    { to: '/invoices', label: 'Billing & Challans', icon: Receipt },
    { to: '/payments', label: 'Payments & Cash', icon: CreditCard },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/sync', label: 'Tally Sync', icon: RefreshCw },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFF8EC]">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#EADBC8] min-h-screen shrink-0 sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#EADBC8] flex items-center gap-3">
          <img src="./logo.jpeg" alt="Nagfani Foods Logo" className="w-10 h-10 object-contain rounded-lg shadow-xs" />
          <div>
            <h1 className="text-base font-bold text-[#2B1B12] leading-none tracking-tight">Nagfani Foods</h1>
            <span className="text-[10px] font-semibold tracking-wider text-[#D9580B] uppercase">Manufacturing ERP</span>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-3">
          <NavLink
            to="/orders/new"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Customer Order</span>
          </NavLink>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#FFF1EB] text-[#D9580B] font-bold shadow-xs border border-[#EADBC8]/60'
                    : 'text-[#514534] hover:bg-[#FFF8EC] hover:text-[#2B1B12]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#D9580B]' : 'text-[#837561]'}`} />
                <span>{item.label}</span>
                {item.to === '/sync' && pendingCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-[#EADBC8] bg-[#FFF8EC]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-[#03353A] text-white flex items-center justify-center font-bold text-xs uppercase">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-[#2B1B12] truncate">{user?.name || 'Operator'}</p>
                <p className="text-[10px] text-[#837561] capitalize">{user?.role?.name || 'Staff'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#837561] hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EADBC8] px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Mobile Brand & Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#2B1B12] rounded-lg hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <img src="./logo.jpeg" alt="Nagfani Foods" className="w-8 h-8 object-contain" />
            <span className="text-sm font-bold text-[#2B1B12]">Nagfani Foods</span>
          </div>

          {/* Center: Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-[#837561] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, customers, mobile, challan, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] focus:border-[#D9580B] focus:bg-white rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#2B1B12] placeholder-[#837561] outline-hidden transition-all"
              />
            </div>
          </form>

          {/* Right: Sync Status & User Profile */}
          <div className="flex items-center gap-3">
            <SyncChip
              status={pendingCount > 0 ? 'pending' : 'synced'}
              count={pendingCount}
              onClick={() => navigate('/sync')}
            />

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#EADBC8]">
              <span className="text-xs font-semibold text-[#2B1B12]">{user?.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#03353A] text-white font-medium">
                {user?.role?.code || 'USER'}
              </span>
            </div>
          </div>
        </header>

        {/* MOBILE SLIDE-OUT MENU */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="w-4/5 max-w-xs h-full bg-white p-4 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#EADBC8]">
                  <div className="flex items-center gap-2">
                    <img src="./logo.jpeg" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-sm">Nagfani Foods ERP</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5 text-stone-500" />
                  </button>
                </div>

                <nav className="mt-4 space-y-1 overflow-y-auto max-h-[70vh]">
                  {navLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#514534] hover:bg-[#FFF8EC]"
                      >
                        <Icon className="w-4 h-4 text-[#D9580B]" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#EADBC8] px-2 py-1.5 flex items-center justify-around shadow-lg">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 text-[10px] font-semibold ${
                isActive ? 'text-[#D9580B]' : 'text-[#837561]'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 text-[10px] font-semibold ${
                isActive ? 'text-[#D9580B]' : 'text-[#837561]'
              }`
            }
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Orders</span>
          </NavLink>

          <NavLink
            to="/orders/new"
            className="flex items-center justify-center w-10 h-10 -mt-4 bg-[#D9580B] text-white rounded-full shadow-md"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </NavLink>

          <NavLink
            to="/stock"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 text-[10px] font-semibold ${
                isActive ? 'text-[#D9580B]' : 'text-[#837561]'
              }`
            }
          >
            <Boxes className="w-5 h-5" />
            <span>Stock</span>
          </NavLink>

          <NavLink
            to="/delivery"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 text-[10px] font-semibold ${
                isActive ? 'text-[#D9580B]' : 'text-[#837561]'
              }`
            }
          >
            <Truck className="w-5 h-5" />
            <span>Dispatch</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
