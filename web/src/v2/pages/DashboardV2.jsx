import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { RadarPulseAnimation } from '../animations/LottieAnimations.jsx';
import { fireSyncCelebration } from '../animations/Confetti.js';

export function DashboardV2() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    todaySales: 48250,
    invoicesCount: 38,
    avgInvoice: 1270,
    monthSales: 982000,
    monthTarget: 1200000,
    monthPace: 81.8,
    outstanding: 324600,
    overdue: 112000,
    overdueParties: 9,
    treasuryTotal: 296250,
    cashInHand: 18400,
    hdfcBank: 245000,
    upiToday: 32850
  });

  const [funnel, setFunnel] = useState({
    received: { count: 14, amount: 41200 },
    packed: { count: 9, label: 'In staging bay' },
    shipped: { count: 6, label: '3 Tempo vans' },
    delivered: { count: 22, label: 'Receipt signed' }
  });

  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    synced: 148,
    inQueue: 7,
    conflicts: 1,
    lastHandshake: '42 seconds ago'
  });

  const [segment, setSegment] = useState('b2b'); // 'b2b' | 'b2c'

  // Fetch live dashboard metrics from API
  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, ordersRes] = await Promise.all([
          api.get('/reports/dashboard').catch(() => null),
          api.get('/orders?limit=50').catch(() => null)
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

        if (ordersRes?.success && Array.isArray(ordersRes.data)) {
          const orders = ordersRes.data;
          const rec = orders.filter(o => o.status === 'received' || o.status === 'confirmed');
          const pac = orders.filter(o => o.status === 'packed' || o.status === 'processing');
          const shp = orders.filter(o => o.status === 'shipped' || o.status === 'dispatched');
          const del = orders.filter(o => o.status === 'delivered');

          if (orders.length > 0) {
            setFunnel({
              received: { count: rec.length, amount: rec.reduce((s, o) => s + (o.grandTotal || 0), 0) },
              packed: { count: pac.length, label: `${pac.length} In staging bay` },
              shipped: { count: shp.length, label: `${shp.length} Vans active` },
              delivered: { count: del.length, label: `${del.length} Receipts signed` }
            });
          }
        }
      } catch (err) {
        // preserve defaults
      }
    }

    loadData();
  }, []);

  const handleSyncNow = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      await api.post('/sync/trigger', {}).catch(() => null);
      setTimeout(() => {
        setSyncStatus(prev => ({
          ...prev,
          isSyncing: false,
          synced: prev.synced + prev.inQueue,
          inQueue: 0,
          lastHandshake: 'Just now'
        }));
        fireSyncCelebration();
      }, 1200);
    } catch {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
        
        {/* Top Operational Bar */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 rounded-2xl shadow-sm border border-[#EADBC8]/60">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-outfit text-2xl sm:text-3xl font-bold text-[#1E2B2D] tracking-tight">
                Good morning, {user?.name || user?.fullName || 'Rushal'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F6F9] text-[#03353A] text-xs font-semibold uppercase tracking-wider border border-[#BCE7ED]">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Live · Savina Godown Scale &amp; Tally ODBC</span>
              </span>
            </div>
            <p className="text-sm text-[#625B4F] font-normal">
              Nagfani Foods Udaipur · Shift Active: Dispatch Operations, Milling Unit &amp; Cash Counter
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('/v2/orders/new')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#D9580B] text-white text-[13px] font-semibold shadow-sm hover:bg-[#BF4B07] transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              <span>New Order</span>
              <span className="bg-[#9F3C00] text-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">F2</span>
            </button>
            <button
              onClick={() => navigate('/purchases/new')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#263335] text-white text-[13px] font-semibold hover:bg-[#1E2B2D] transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Purchase</span>
              <span className="bg-[#3B656A] text-[#E5F3F6] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">F3</span>
            </button>
            <button
              onClick={() => navigate('/v2/manufacturing')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#E8F6F9] text-[#03353A] text-[13px] font-semibold hover:bg-[#BCE7ED] transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
              <span>Batch</span>
              <span className="bg-[#CEDDDF] text-[#03353A] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">F4</span>
            </button>
            <button
              onClick={handleSyncNow}
              disabled={syncStatus.isSyncing}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#E8F6F9] text-[#03353A] text-[13px] font-semibold hover:bg-[#BCE7ED] transition-all active:scale-[0.98]"
            >
              <span className={`material-symbols-outlined text-[18px] ${syncStatus.isSyncing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{syncStatus.isSyncing ? 'Syncing...' : 'Tally Sync'}</span>
              <span className="bg-[#CEDDDF] text-[#03353A] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">F5</span>
            </button>
          </div>
        </section>

        {/* Bento Row 1: 4 Hero KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* KPI 1: Today's Sales */}
          <div className="relative overflow-hidden bg-white p-5 rounded-2xl shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#625B4F]">Today's Sales</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-outfit text-3xl font-extrabold text-[#111E20]">
                    ₹{metrics.todaySales.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                +12%
              </span>
            </div>
            
            {/* SVG Sparkline */}
            <div className="my-3">
              <svg className="w-full h-11 text-[#D9580B] overflow-visible" fill="none" viewBox="0 0 200 44">
                <defs>
                  <linearGradient id="salesGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#D9580B" stopOpacity="0.3"></stop>
                    <stop offset="100%" stopColor="#D9580B" stopOpacity="0.0"></stop>
                  </linearGradient>
                </defs>
                <path d="M0,38 C25,32 50,39 75,25 C100,11 125,28 150,14 C175,0 190,12 200,8 L200,44 L0,44 Z" fill="url(#salesGrad)"></path>
                <path d="M0,38 C25,32 50,39 75,25 C100,11 125,28 150,14 C175,0 190,12 200,8" stroke="#D9580B" strokeLinecap="round" strokeWidth="2.5"></path>
              </svg>
            </div>

            <div className="flex items-center justify-between pt-2 bg-[#E8F6F9]/60 -mx-5 -mb-5 px-5 py-2.5 text-[#625B4F] text-[12px] font-medium border-t border-[#EADBC8]/40">
              <span>{metrics.invoicesCount} Invoices Billed</span>
              <span>Avg: ₹{metrics.avgInvoice}</span>
            </div>
          </div>

          {/* KPI 2: Month Sales Velocity */}
          <div className="relative overflow-hidden bg-white p-5 rounded-2xl shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#625B4F]">Month Sales Velocity</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-outfit text-3xl font-extrabold text-[#111E20]">
                    ₹{(metrics.monthSales / 100000).toFixed(2)}L
                  </span>
                  <span className="text-xs font-semibold text-[#625B4F]">/ ₹{(metrics.monthTarget / 100000).toFixed(1)}L</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#BFEAF0] text-[#001F23] text-[11px] font-bold">
                Day 24/31
              </span>
            </div>

            <div className="my-3 space-y-2">
              <div className="flex justify-between items-center text-xs text-[#625B4F]">
                <span>Monthly Target Pace</span>
                <span className="font-bold text-[#111E20]">{metrics.monthPace}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#E2F1F3] overflow-hidden flex">
                <div className="h-full bg-[#D9580B] rounded-full transition-all duration-700" style={{ width: `${metrics.monthPace}%` }}></div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 bg-[#E8F6F9]/60 -mx-5 -mb-5 px-5 py-2.5 text-[#625B4F] text-[12px] font-medium border-t border-[#EADBC8]/40">
              <span>Remaining: ₹2,17,600</span>
              <span className="text-emerald-700 font-bold">On Track</span>
            </div>
          </div>

          {/* KPI 3: Market Outstanding */}
          <div className="relative overflow-hidden bg-white p-5 rounded-2xl shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#625B4F]">Market Outstanding</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-outfit text-3xl font-extrabold text-[#111E20]">
                    ₹{metrics.outstanding.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-bold border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                Attention
              </span>
            </div>

            <div className="my-3">
              <div className="p-2.5 rounded-xl bg-red-50/80 border border-red-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600 text-[20px]">warning</span>
                  <div>
                    <span className="text-xs block text-red-700 font-bold">₹{metrics.overdue.toLocaleString('en-IN')} Overdue</span>
                    <span className="text-[11px] text-[#625B4F]">Credit &gt; 30 days</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white text-red-700 border border-red-200 shadow-xs">
                  {metrics.overdueParties} Parties
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 bg-[#E8F6F9]/60 -mx-5 -mb-5 px-5 py-2.5 text-[#625B4F] text-[12px] font-medium border-t border-[#EADBC8]/40">
              <span>Total Active Accounts: 64</span>
              <button onClick={() => navigate('/outstanding')} className="text-[#D9580B] hover:underline font-bold text-xs">
                Ledger →
              </button>
            </div>
          </div>

          {/* KPI 4: Liquid Treasury */}
          <div className="relative overflow-hidden bg-white p-5 rounded-2xl shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#625B4F]">Liquid Treasury</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-outfit text-3xl font-extrabold text-[#111E20]">
                    ₹{metrics.treasuryTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#E2F1F3] text-[#03353A] text-[11px] font-semibold">
                Audited 10m ago
              </span>
            </div>

            <div className="my-2.5 space-y-1.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#625B4F] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-600">account_balance_wallet</span>
                  Cash in Hand:
                </span>
                <span className="font-bold text-[#111E20]">₹{metrics.cashInHand.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#625B4F] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">account_balance</span>
                  HDFC Bank:
                </span>
                <span className="font-bold text-[#111E20]">₹{metrics.hdfcBank.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#625B4F] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">qr_code_scanner</span>
                  UPI Today:
                </span>
                <span className="font-bold text-[#111E20]">₹{metrics.upiToday.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 bg-[#E8F6F9]/60 -mx-5 -mb-5 px-5 py-2.5 text-[#625B4F] text-[12px] font-medium border-t border-[#EADBC8]/40">
              <span>Savina Vault Locked</span>
              <span className="material-symbols-outlined text-[#03353A] text-[16px]">lock</span>
            </div>
          </div>
        </section>

        {/* Bento Row 2: Live Pipeline Funnel (7 cols) & Tally Live Connector (5 cols) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Order Funnel (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#D9580B] text-[24px]">swap_calls</span>
                  <div>
                    <h2 className="font-outfit font-bold text-lg text-[#111E20]">Live Order Execution Pipeline</h2>
                    <span className="text-xs text-[#625B4F]">Shift dispatch funnel across 4 wholesale distribution routes</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                  <span className="material-symbols-outlined text-[14px]">timer</span>
                  <span>Avg packing: 18 min</span>
                </div>
              </div>

              {/* 4 Funnel Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5">
                {/* Received */}
                <div
                  onClick={() => navigate('/v2/orders')}
                  className="p-3.5 rounded-xl bg-blue-50/70 hover:bg-blue-50 transition-all flex flex-col justify-between border border-blue-200/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Received</span>
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">inbox</span>
                  </div>
                  <div className="mt-3">
                    <span className="font-outfit text-2xl font-bold text-blue-900">{funnel.received.count}</span>
                    <span className="text-xs text-blue-700 block mt-0.5">₹{funnel.received.amount.toLocaleString('en-IN')} total</span>
                  </div>
                </div>

                {/* Packed */}
                <div
                  onClick={() => navigate('/v2/orders')}
                  className="p-3.5 rounded-xl bg-amber-50/70 hover:bg-amber-50 transition-all flex flex-col justify-between border border-amber-200/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Packed</span>
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">inventory_2</span>
                  </div>
                  <div className="mt-3">
                    <span className="font-outfit text-2xl font-bold text-amber-900">{funnel.packed.count}</span>
                    <span className="text-xs text-amber-700 block mt-0.5">{funnel.packed.label}</span>
                  </div>
                </div>

                {/* Shipped */}
                <div
                  onClick={() => navigate('/v2/delivery')}
                  className="p-3.5 rounded-xl bg-purple-50/70 hover:bg-purple-50 transition-all flex flex-col justify-between border border-purple-200/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Shipped</span>
                    <span className="material-symbols-outlined text-purple-600 text-[18px]">local_shipping</span>
                  </div>
                  <div className="mt-3">
                    <span className="font-outfit text-2xl font-bold text-purple-900">{funnel.shipped.count}</span>
                    <span className="text-xs text-purple-700 block mt-0.5">{funnel.shipped.label}</span>
                  </div>
                </div>

                {/* Delivered */}
                <div
                  onClick={() => navigate('/v2/orders')}
                  className="p-3.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-50 transition-all flex flex-col justify-between border border-emerald-200/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Delivered</span>
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                  </div>
                  <div className="mt-3">
                    <span className="font-outfit text-2xl font-bold text-emerald-900">{funnel.delivered.count}</span>
                    <span className="text-xs text-emerald-700 block mt-0.5">{funnel.delivered.label}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Funnel Progression Bar */}
            <div className="space-y-2 pt-2 border-t border-[#EADBC8]/40">
              <div className="w-full h-2.5 rounded-full bg-[#E2F1F3] overflow-hidden flex gap-0.5">
                <div className="h-full bg-blue-500 rounded-l-full" style={{ width: '27%' }}></div>
                <div className="h-full bg-amber-500" style={{ width: '18%' }}></div>
                <div className="h-full bg-purple-500" style={{ width: '12%' }}></div>
                <div className="h-full bg-emerald-600 rounded-r-full" style={{ width: '43%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-[#625B4F] font-medium">
                <span>51 Orders Active Today</span>
                <span>82% Fulfillment Velocity</span>
              </div>
            </div>
          </div>

          {/* Tally Connector Card (5 Cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <RadarPulseAnimation size={44} />
                  </div>
                  <div>
                    <h2 className="font-outfit font-bold text-lg text-[#111E20]">TallyPrime ODBC Sync</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-xs text-emerald-700 font-bold">Active &amp; Listening on Port 9000</span>
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs text-[#625B4F] bg-[#E8F6F9] px-2 py-1 rounded font-semibold border border-[#CEDDDF]">
                  v2.4.1
                </span>
              </div>

              {/* Status metric tiles */}
              <div className="grid grid-cols-3 gap-3 my-5">
                <div className="p-3 rounded-xl bg-[#E8F6F9] text-center border border-[#CEDDDF]/60">
                  <span className="font-outfit font-extrabold text-2xl text-emerald-700 block">{syncStatus.synced}</span>
                  <span className="text-[10px] font-bold text-[#625B4F] uppercase tracking-wider">Synced</span>
                </div>
                <div className="p-3 rounded-xl bg-[#FFF8EC] text-center border border-[#EADBC8]">
                  <span className="font-outfit font-extrabold text-2xl text-amber-700 block">{syncStatus.inQueue}</span>
                  <span className="text-[10px] font-bold text-[#625B4F] uppercase tracking-wider">In Queue</span>
                </div>
                <div className="p-3 rounded-xl bg-red-50 text-center border border-red-200">
                  <span className="font-outfit font-extrabold text-2xl text-red-600 block">{syncStatus.conflicts}</span>
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Conflict</span>
                </div>
              </div>

              {/* Conflict banner */}
              <div className="p-3 rounded-xl bg-[#FFF8EC] border border-[#E8A317]/50 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#D9580B] text-[20px] shrink-0 mt-0.5">rule</span>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#111E20] block">Ledger Name Discrepancy</span>
                  <p className="text-[11px] text-[#625B4F] truncate">Party 'Mahalaxmi Kirana' GSTIN format conflict with Tally Master.</p>
                </div>
                <button
                  onClick={() => navigate('/sync')}
                  className="px-2.5 py-1 bg-white text-[#D9580B] text-xs font-bold rounded-lg border border-[#EADBC8] hover:bg-[#FFF7EE] transition-colors shrink-0 shadow-xs"
                >
                  Review
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#EADBC8]/40">
              <span className="text-xs text-[#625B4F]">Last handshake: {syncStatus.lastHandshake}</span>
              <button
                onClick={handleSyncNow}
                disabled={syncStatus.isSyncing}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#03353A] text-white rounded-xl text-xs font-bold hover:bg-[#06484F] active:scale-95 transition-all shadow-sm"
              >
                <span className={`material-symbols-outlined text-[16px] ${syncStatus.isSyncing ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>{syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Bento Row 3: 30-Day Sales Velocity (7 cols) & Area Dispatches (5 cols) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 30-Day Sales Chart Card (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-outfit font-bold text-lg text-[#111E20]">30-Day Sales Velocity &amp; Demand</h2>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-[#625B4F]">
                  <span>Trend across Savina Mandi, Chetak &amp; Sukher clusters</span>
                  <span className="w-1 h-1 rounded-full bg-[#8C7166]"></span>
                  <span className="text-[#D9580B] font-bold">Daily Avg: ₹32.4k</span>
                </div>
              </div>

              {/* Wholesale / Retail Segment Switcher */}
              <div className="inline-flex p-1 rounded-xl bg-[#E8F6F9] text-[#111E20] self-start sm:self-auto border border-[#CEDDDF]">
                <button
                  onClick={() => setSegment('b2b')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    segment === 'b2b' ? 'bg-white shadow-xs text-[#03353A]' : 'text-[#625B4F]'
                  }`}
                >
                  B2B Wholesale
                </button>
                <button
                  onClick={() => setSegment('b2c')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    segment === 'b2c' ? 'bg-white shadow-xs text-[#03353A]' : 'text-[#625B4F]'
                  }`}
                >
                  B2C Doorstep
                </button>
              </div>
            </div>

            {/* Custom SVG Area & Bar Combo Visualization */}
            <div className="w-full h-56 relative my-2">
              <div className="absolute inset-x-0 top-[38%] border-b border-dashed border-[#8C7166]/30 flex justify-end">
                <span className="text-[10px] text-[#625B4F] px-1 -mt-4 bg-white font-medium">Avg: ₹32,400</span>
              </div>
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 220">
                <defs>
                  <linearGradient id="velocityFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#D9580B" stopOpacity="0.32"></stop>
                    <stop offset="60%" stopColor="#D9580B" stopOpacity="0.08"></stop>
                    <stop offset="100%" stopColor="#D9580B" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                {/* Subtle Bar indicators for daily volume */}
                <rect fill="#CEDDDF" height="60" rx="3" width="8" x="25" y="140"></rect>
                <rect fill="#CEDDDF" height="80" rx="3" width="8" x="65" y="120"></rect>
                <rect fill="#CEDDDF" height="110" rx="3" width="8" x="105" y="90"></rect>
                <rect fill="#CEDDDF" height="70" rx="3" width="8" x="145" y="130"></rect>
                <rect fill="#CEDDDF" height="130" rx="3" width="8" x="185" y="70"></rect>
                <rect fill="#CEDDDF" height="100" rx="3" width="8" x="225" y="100"></rect>
                <rect fill="#CEDDDF" height="140" rx="3" width="8" x="265" y="60"></rect>
                <rect fill="#CEDDDF" height="90" rx="3" width="8" x="305" y="110"></rect>
                <rect fill="#CEDDDF" height="120" rx="3" width="8" x="345" y="80"></rect>
                <rect fill="#CEDDDF" height="150" rx="3" width="8" x="385" y="50"></rect>
                <rect fill="#CEDDDF" height="115" rx="3" width="8" x="425" y="85"></rect>
                <rect fill="#CEDDDF" height="130" rx="3" width="8" x="465" y="70"></rect>
                <rect fill="#CEDDDF" height="160" rx="3" width="8" x="505" y="40"></rect>
                <rect fill="#D9580B" height="170" opacity="0.8" rx="3" width="8" x="545" y="30"></rect>

                {/* Area Path Under Trendline */}
                <path d="M 20,150 Q 70,120 120,80 T 220,95 T 320,65 T 420,70 T 520,38 T 575,25 L 575,200 L 20,200 Z" fill="url(#velocityFill)"></path>
                {/* Active Smooth Line */}
                <path d="M 20,150 Q 70,120 120,80 T 220,95 T 320,65 T 420,70 T 520,38 T 575,25" fill="none" stroke="#D9580B" strokeLinecap="round" strokeWidth="3"></path>
                {/* Peak Highlight Dot */}
                <circle cx="575" cy="25" fill="#D9580B" r="4.5"></circle>
                <circle cx="575" cy="25" fill="#D9580B" opacity="0.25" r="9"></circle>
              </svg>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#EADBC8]/40 text-xs text-[#625B4F]">
              <span>Day 1 (Feb 01)</span>
              <span>Day 10</span>
              <span>Day 20</span>
              <span className="text-[#D9580B] font-bold">Today (Day 24: Peak ₹48.2k)</span>
            </div>
          </div>

          {/* Area-wise Deliveries Today (5 Cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-outfit font-bold text-lg text-[#111E20]">Area Dispatches</h2>
                <span className="text-xs text-[#625B4F]">38 drops mapped across Udaipur zones</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#E8F6F9] text-[#03353A] text-xs font-bold border border-[#CEDDDF]">
                5 Active Vans
              </span>
            </div>

            {/* Zone Delivery Bars */}
            <div className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#111E20] font-semibold">Sec 3 &amp; Mewar Industrial</span>
                  <span className="text-[#111E20] font-bold">12 drops <span className="text-[#625B4F] font-normal">· ₹38,200</span></span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E2F1F3] overflow-hidden">
                  <div className="h-full bg-[#D9580B] rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#111E20] font-semibold">Savina Krishi Mandi</span>
                  <span className="text-[#111E20] font-bold">9 drops <span className="text-[#625B4F] font-normal">· ₹24,500</span></span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E2F1F3] overflow-hidden">
                  <div className="h-full bg-[#03353A] rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#111E20] font-semibold">UIT Colony &amp; Chetak Circle</span>
                  <span className="text-[#111E20] font-bold">7 drops <span className="text-[#625B4F] font-normal">· ₹16,400</span></span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E2F1F3] overflow-hidden">
                  <div className="h-full bg-[#3B656A] rounded-full" style={{ width: '48%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#111E20] font-semibold">Hiran Magri (Sec 4-11)</span>
                  <span className="text-[#111E20] font-bold">6 drops <span className="text-[#625B4F] font-normal">· ₹14,900</span></span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E2F1F3] overflow-hidden">
                  <div className="h-full bg-[#7C7466] rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#111E20] font-semibold">Titardi &amp; Balicha Bypass</span>
                  <span className="text-[#111E20] font-bold">4 drops <span className="text-[#625B4F] font-normal">· ₹8,800</span></span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E2F1F3] overflow-hidden">
                  <div className="h-full bg-[#E0C0B3] rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs border-t border-[#EADBC8]/40">
              <span className="text-[#03353A] font-semibold">Driver Manifest: 100% Assigned</span>
              <button onClick={() => navigate('/v2/delivery')} className="text-[#D9580B] font-bold hover:underline">
                Route Sheet →
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
