import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../store/useAuthStore.js';

export function DashboardV3() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    todaySales: 48250,
    invoicesCount: 38,
    avgInvoice: 1270,
    monthSales: 982000,
    monthTarget: 1200000,
    monthPercent: 81.8,
    outstanding: 324600,
    overdue: 112000,
    overdueParties: 9,
    treasuryTotal: 296250,
    cashInHand: 18400,
    hdfcBank: 245000,
    upiToday: 32850
  });

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'received' | 'packed' | 'shipped' | 'delivered'
  const [orders, setOrders] = useState([
    {
      _id: 'ord-1026',
      orderNo: 'SO-2024-1026',
      customerName: 'Sharma General Store',
      area: 'Hiran Magri Sec 3',
      items: 'Urad Papad 30kg, Khakhra 8kg, Loung Sev 20kg',
      amount: 14850,
      weightKg: 62.0,
      status: 'received',
      time: '12m ago'
    },
    {
      _id: 'ord-1027',
      orderNo: 'SO-2024-1027',
      customerName: 'Mahalaxmi Kirana Mandir',
      area: 'Savina Main Mandi',
      items: 'Chana Masala Papad 50kg, Bikaneri Bhujia 40kg',
      amount: 22400,
      weightKg: 110.0,
      status: 'received',
      time: '28m ago'
    },
    {
      _id: 'ord-1028',
      orderNo: 'SO-2024-1028',
      customerName: 'Jodhpur Sweets & Namkeen',
      area: 'Krishi Upaj Mandi',
      items: 'Special Moong Papad 100kg, Ratlami Sev 50kg',
      amount: 38500,
      weightKg: 165.0,
      status: 'packed',
      time: '45m ago'
    },
    {
      _id: 'ord-1029',
      orderNo: 'SO-2024-1029',
      customerName: 'Kailash Provision Store',
      area: 'UIT Colony / Fatehpura',
      items: 'Methi Khakhra 5kg, Hing Pickle 3kg',
      amount: 4650,
      weightKg: 18.0,
      status: 'shipped',
      time: '1h ago'
    },
    {
      _id: 'ord-1030',
      orderNo: 'SO-2024-1030',
      customerName: 'Anoop Traders',
      area: 'Sukher Industrial Area',
      items: 'Export Grade Papad 180kg, Masala Sev 60kg',
      amount: 54200,
      weightKg: 240.0,
      status: 'delivered',
      time: '2h ago'
    }
  ]);

  const [syncState, setSyncState] = useState({
    synced: 148,
    queue: 7,
    conflict: 1,
    isSyncing: false
  });

  // Fetch real metrics & orders
  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, ordersRes] = await Promise.all([
          api.get('/reports/dashboard').catch(() => null),
          api.get('/orders?limit=15').catch(() => null)
        ]);

        if (dashRes?.success && dashRes.data) {
          const d = dashRes.data;
          setMetrics(prev => ({
            ...prev,
            todaySales: d.todaySales || prev.todaySales,
            invoicesCount: d.invoicesCount || prev.invoicesCount,
            outstanding: d.totalOutstanding || prev.outstanding
          }));
        }

        if (ordersRes?.success && Array.isArray(ordersRes.data) && ordersRes.data.length > 0) {
          const mapped = ordersRes.data.map(o => ({
            _id: o._id,
            orderNo: o.orderNo || `SO-${o._id.slice(-4).toUpperCase()}`,
            customerName: o.partyId?.name || o.customerName || 'Udaipur Retailer',
            area: o.partyId?.areaId?.name || o.areaId?.name || 'Savina Beat',
            items: o.items?.map(i => `${i.name || i.productName} (${i.qty || i.quantity || 1})`).join(', ') || 'Assorted Papad & Snacks',
            amount: o.grandTotal || o.totalAmount || 12000,
            weightKg: 45.0,
            status: o.status || 'received',
            time: 'Today'
          }));
          setOrders(mapped);
        }
      } catch {
        // keep fallback
      }
    }
    loadData();
  }, []);

  const handleAdvanceStatus = (orderId, current) => {
    const nextMap = { received: 'packed', packed: 'shipped', shipped: 'delivered', delivered: 'received' };
    const next = nextMap[current];
    setOrders(prev => prev.map(o => (o._id === orderId ? { ...o, status: next } : o)));
    api.patch(`/orders/${orderId}/status`, { status: next }).catch(() => null);
  };

  const handleSyncNow = async () => {
    setSyncState(s => ({ ...s, isSyncing: true }));
    try {
      await api.post('/sync/trigger', {}).catch(() => null);
      setTimeout(() => {
        setSyncState(s => ({
          ...s,
          isSyncing: false,
          synced: s.synced + s.queue,
          queue: 0
        }));
      }, 1000);
    } catch {
      setSyncState(s => ({ ...s, isSyncing: false }));
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'all') return true;
    return o.status === activeTab;
  });

  const counts = {
    all: orders.length,
    received: orders.filter(o => o.status === 'received').length,
    packed: orders.filter(o => o.status === 'packed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Welcome & Operational Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Operations Overview
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Shift Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Nagfani Foods Udaipur · Savina Mandi Godown A · Live Production &amp; Dispatches
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/v3/orders/new')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">add_shopping_cart</span>
            <span>New Order (F2)</span>
          </button>
          <button
            onClick={() => navigate('/v3/purchases')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[17px] text-slate-500">add</span>
            <span>Purchase Entry</span>
          </button>
          <button
            onClick={() => navigate('/v3/production')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[17px] text-slate-500">precision_manufacturing</span>
            <span>Batch Run</span>
          </button>
          <button
            onClick={handleSyncNow}
            disabled={syncState.isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors shadow-xs"
          >
            <span className={`material-symbols-outlined text-[17px] text-slate-500 ${syncState.isSyncing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{syncState.isSyncing ? 'Syncing...' : 'Tally Sync'}</span>
          </button>
        </div>
      </div>

      {/* 4 Crisp Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Today's Sales</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-100">
                +12% vs yest.
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              ₹{metrics.todaySales.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{metrics.invoicesCount} Invoices Billed</span>
            <span>Avg: ₹{metrics.avgInvoice}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Monthly Target Pace</span>
              <span className="text-slate-600 font-mono text-[11px]">Day 24/31</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                ₹{(metrics.monthSales / 100000).toFixed(2)}L
              </span>
              <span className="text-xs text-slate-400">/ ₹{(metrics.monthTarget / 100000).toFixed(1)}L</span>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#EA580C] h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.monthPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Target: 81.8%</span>
              <span className="text-emerald-700 font-semibold">On Track</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Market Outstanding</span>
              <span className="text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded text-[10px] border border-rose-100">
                Action Required
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              ₹{metrics.outstanding.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-rose-600 font-medium">₹1.12L Overdue (9 parties)</span>
            <button
              onClick={() => navigate('/v3/payments')}
              className="text-[#EA580C] hover:underline font-semibold"
            >
              Ledger →
            </button>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Liquid Treasury</span>
              <span className="text-slate-400 text-[10px]">Audited 10m ago</span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              ₹{metrics.treasuryTotal.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex justify-between">
            <span>Cash: ₹18.4k</span>
            <span>HDFC: ₹2.45L</span>
            <span>UPI: ₹32.8k</span>
          </div>
        </div>
      </div>

      {/* Primary Section: 2-Column Clean Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Order Execution Pipeline & Quick Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header & Tabs */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Order Pipeline</h2>
              <p className="text-xs text-slate-500">Live order queue from Savina, Hiran Magri &amp; Sukher routes</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'all' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'received' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                Received ({counts.received})
              </button>
              <button
                onClick={() => setActiveTab('packed')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'packed' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                Packed ({counts.packed})
              </button>
              <button
                onClick={() => setActiveTab('shipped')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'shipped' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                Shipped ({counts.shipped})
              </button>
            </div>
          </div>

          {/* Clean Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Party &amp; Area</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Stage</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No orders currently in this stage
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(o => (
                    <tr key={o._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {o.orderNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{o.customerName}</div>
                        <div className="text-[11px] text-slate-400">{o.area}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate text-[11px]">
                        {o.items}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{o.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            o.status === 'received'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : o.status === 'packed'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : o.status === 'shipped'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleAdvanceStatus(o._id, o.status)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-[#EA580C] hover:text-white text-slate-700 text-[11px] font-medium rounded transition-colors"
                        >
                          Advance →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredOrders.length} active orders</span>
            <button
              onClick={() => navigate('/v3/orders')}
              className="text-[#EA580C] font-semibold hover:underline"
            >
              View Full Orders Board →
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): TallyPrime Sync Card & Van Dispatches */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Tally Connector Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                  <span className="material-symbols-outlined text-[19px]">sync_alt</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">TallyPrime ODBC Sync</h3>
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Listening on Port 9000</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                v2.4.1
              </span>
            </div>

            {/* Sync Metric Tiles */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-mono text-xl font-extrabold text-emerald-700">{syncState.synced}</div>
                <div className="text-[10px] font-medium text-slate-500 uppercase">Synced</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-mono text-xl font-extrabold text-amber-700">{syncState.queue}</div>
                <div className="text-[10px] font-medium text-slate-500 uppercase">In Queue</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-mono text-xl font-extrabold text-rose-600">{syncState.conflict}</div>
                <div className="text-[10px] font-medium text-slate-500 uppercase">Conflict</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
              <span className="text-slate-500">Last heartbeat: 42s ago</span>
              <button
                onClick={handleSyncNow}
                disabled={syncState.isSyncing}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span className={`material-symbols-outlined text-[15px] ${syncState.isSyncing ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>{syncState.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>

          {/* Today's Van Route Dispatch Summary */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Van Route Dispatches</h3>
                <span className="text-xs text-slate-500">38 stops across 4 morning beats</span>
              </div>
              <button
                onClick={() => navigate('/v3/delivery')}
                className="text-xs text-[#EA580C] hover:underline font-semibold"
              >
                View Fleet →
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Route 1 */}
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-slate-900">Van 01 · Mukesh Sharma</div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                    5/8 Stops
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#EA580C] h-full rounded-full" style={{ width: '62%' }}></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Sec 3 &amp; Mewar Industrial</span>
                  <span>₹32,500 Cash to collect</span>
                </div>
              </div>

              {/* Route 2 */}
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-slate-900">Van 02 · Sohan Lal</div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    Loading Bay 2
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full" style={{ width: '15%' }}></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Savina Krishi Mandi Wholesale</span>
                  <span>₹44,200 Cash to collect</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Low Stock Warning Strip */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
            <h3 className="text-sm font-bold text-slate-900">Low Raw Material Inventory Alerts</h3>
          </div>
          <span className="text-xs text-slate-500">Savina Godown Storage</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Urad Mogar Dal Flour</div>
              <div className="text-slate-500 text-[11px]">Current: <strong className="text-rose-600">180 kg</strong> (Min: 250 kg)</div>
            </div>
            <button
              onClick={() => navigate('/v3/purchases')}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              Reorder
            </button>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Poly Pouches 500g</div>
              <div className="text-slate-500 text-[11px]">Current: <strong className="text-rose-600">420 pcs</strong> (Min: 1000 pcs)</div>
            </div>
            <button
              onClick={() => navigate('/v3/purchases')}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              Reorder
            </button>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Loung / Cloves Coarse</div>
              <div className="text-slate-500 text-[11px]">Current: <strong className="text-rose-600">8 kg</strong> (Min: 15 kg)</div>
            </div>
            <button
              onClick={() => navigate('/v3/purchases')}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
            >
              Reorder
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
