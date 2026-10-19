import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  Truck,
  IndianRupee,
  Factory,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  PhoneCall,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client.js';
import { MetricCard } from '../components/MetricCard.jsx';
import { SyncChip } from '../components/SyncChip.jsx';
import { getSocket } from '../api/socket.js';

export function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to real-time events to auto-refresh metrics
    const socket = getSocket();
    if (socket) {
      socket.on('order:created', fetchDashboardData);
      socket.on('order:status', fetchDashboardData);
      socket.on('stock:changed', fetchDashboardData);
      socket.on('production:created', fetchDashboardData);
    }

    return () => {
      if (socket) {
        socket.off('order:created');
        socket.off('order:status');
        socket.off('stock:changed');
        socket.off('production:created');
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#D9580B] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#837561]">Loading Live Operations Desk...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const statusCounts = metrics.statusCounts || {};
  const salesTrend = data?.salesTrend || [];
  const topCustomers = data?.topCustomers || [];

  const maxSale = Math.max(...salesTrend.map(s => s.total), 1);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EADBC8] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
              Operations Control Desk
            </h2>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-[#837561] mt-0.5">
            Real-time Udaipur dispatch routes, factory stock & Tally synchronization
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <NavLink
            to="/orders/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Order</span>
          </NavLink>

          <NavLink
            to="/manufacturing/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#03353A] hover:bg-[#022529] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Factory className="w-4 h-4 stroke-[2]" />
            <span>Produce Batch</span>
          </NavLink>

          <NavLink
            to="/purchases/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EADBC8] bg-[#FFF8EC] hover:bg-[#FFF1EB] text-[#2B1B12] text-xs font-semibold transition-colors"
          >
            <span>Inward Raw Material</span>
          </NavLink>
        </div>
      </div>

      {/* Bento Grid Row 1: KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Sales"
          value={`₹${(metrics.todaySales || 0).toLocaleString('en-IN')}`}
          subtext={`Monthly: ₹${(metrics.monthSales || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          color="primary"
        />

        <MetricCard
          title="B2B vs B2C Split"
          value={`₹${(metrics.b2bSales || 0).toLocaleString('en-IN')}`}
          subtext={`B2C: ₹${(metrics.b2cSales || 0).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="teal"
        />

        <MetricCard
          title="Today's Production"
          value={`${(metrics.todayProductionQty || 0).toLocaleString('en-IN')} pcs`}
          subtext="Finished Goods Output"
          icon={Factory}
          color="amber"
        />

        <MetricCard
          title="Total Outstanding"
          value={`₹${(metrics.outstandingTotal || 0).toLocaleString('en-IN')}`}
          subtext="Accounts Receivable"
          icon={AlertTriangle}
          color="maroon"
        />
      </div>

      {/* Bento Grid Row 2: Live Pipeline Tracker */}
      <div className="bg-white p-5 rounded-2xl border border-[#EADBC8] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold font-['Epilogue'] text-[#2B1B12]">
              Order Fulfillment Pipeline
            </h3>
            <p className="text-xs text-[#837561]">Step-by-step dispatch workflow</p>
          </div>
          <NavLink to="/orders" className="text-xs font-semibold text-[#D9580B] hover:underline flex items-center gap-1">
            <span>View All Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => navigate('/orders?status=received')}
            className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">1. Received</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-bold font-['Epilogue'] text-blue-900 table-nums">
              {statusCounts.received || 0}
            </div>
            <p className="text-[11px] text-blue-600 mt-0.5">Reserved in Godown</p>
          </div>

          <div
            onClick={() => navigate('/orders?status=packed')}
            className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">2. Packed</span>
              <Package className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold font-['Epilogue'] text-amber-900 table-nums">
              {statusCounts.packed || 0}
            </div>
            <p className="text-[11px] text-amber-600 mt-0.5">Ready for Van Loading</p>
          </div>

          <div
            onClick={() => navigate('/orders?status=shipped')}
            className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">3. Shipped</span>
              <Truck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-bold font-['Epilogue'] text-purple-900 table-nums">
              {statusCounts.shipped || 0}
            </div>
            <p className="text-[11px] text-purple-600 mt-0.5">Out on Route</p>
          </div>

          <div
            onClick={() => navigate('/orders?status=delivered')}
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">4. Delivered</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold font-['Epilogue'] text-emerald-900 table-nums">
              {statusCounts.delivered || 0}
            </div>
            <p className="text-[11px] text-emerald-600 mt-0.5">Successfully Handed Over</p>
          </div>
        </div>
      </div>

      {/* Bento Grid Row 3: 30-Day Sales Chart & Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 30-Day Sales Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#EADBC8] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-['Epilogue'] text-[#2B1B12]">
                  30-Day Daily Sales Velocity
                </h3>
                <p className="text-xs text-[#837561]">Aggregated daily revenue trends</p>
              </div>
              <span className="text-xs font-bold text-[#D9580B] bg-[#FFF1EB] px-2.5 py-1 rounded-full border border-[#EADBC8]">
                Daily INR (₹)
              </span>
            </div>

            {/* Pure CSS Bar Chart */}
            <div className="mt-6 flex items-end gap-1.5 h-44 pt-6 border-b border-[#EADBC8]">
              {salesTrend.map((st, idx) => {
                const heightPercent = Math.max(8, Math.round((st.total / maxSale) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#2B1B12] text-white text-[10px] py-1 px-1.5 rounded-sm whitespace-nowrap z-20 pointer-events-none">
                      {st.date.slice(5)}: ₹{st.total.toLocaleString('en-IN')}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        st.total > 0
                          ? 'bg-[#D9580B] group-hover:bg-[#b54504]'
                          : 'bg-stone-100'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-[#837561] mt-2 font-medium">
              <span>{salesTrend[0]?.date || ''}</span>
              <span>Today ({salesTrend[salesTrend.length - 1]?.date || ''})</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EADBC8] flex items-center justify-between text-xs">
            <span className="text-[#837561]">Current Cash in Hand:</span>
            <span className="font-bold text-[#2B1B12] table-nums">₹{(metrics.cashBalance || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Right: Top Customer Balances */}
        <div className="bg-white p-5 rounded-2xl border border-[#EADBC8] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold font-['Epilogue'] text-[#2B1B12]">
                Top Customer Dues
              </h3>
              <NavLink to="/outstanding" className="text-xs font-semibold text-[#D9580B] hover:underline">
                View All
              </NavLink>
            </div>

            <div className="space-y-3">
              {topCustomers.length === 0 ? (
                <p className="text-xs text-[#837561] italic py-6 text-center">No outstanding debts.</p>
              ) : (
                topCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => navigate(`/customers/${cust.id}`)}
                    className="p-2.5 rounded-xl border border-[#EADBC8] bg-[#FFF8EC]/30 hover:bg-[#FFF8EC] cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="truncate mr-2">
                      <p className="text-xs font-bold text-[#2B1B12] truncate">{cust.name}</p>
                      <p className="text-[10px] text-[#837561] flex items-center gap-1">
                        <PhoneCall className="w-2.5 h-2.5" />
                        <span>{cust.mobile}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-[#7A1F2B] table-nums">
                        ₹{cust.balance.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-rose-600 font-semibold">Due</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Warning Card */}
          {metrics.lowStockCount > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-xs font-semibold text-amber-900">
                  {metrics.lowStockCount} items below safety stock
                </span>
              </div>
              <NavLink to="/stock?lowStockOnly=true" className="text-xs font-bold text-amber-800 hover:underline">
                Reorder
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
