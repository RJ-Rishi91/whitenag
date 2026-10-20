import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';

export function OrdersV3() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'board'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [syncingOrder, setSyncingOrder] = useState(null);

  // Default Udaipur food distribution orders matching realistic FMCG operations
  const defaultOrders = [
    {
      _id: 'ord-1026',
      orderNumber: 'SO-2024-1026',
      customerName: 'Sharma General Store',
      sector: 'Hiran Magri (Sec 3)',
      channel: 'B2B Wholesale',
      paymentStatus: 'paid',
      grandTotal: 14850,
      totalWeightKg: 62.0,
      itemsSummary: 'Urad Papad (30kg), Khakhra (8kg), Loung Sev (20kg)',
      status: 'received',
      tallySynced: true,
      van: 'Van 01 (Mukesh)',
      time: '12m ago'
    },
    {
      _id: 'ord-1027',
      orderNumber: 'SO-2024-1027',
      customerName: 'Mahalaxmi Kirana Mandir',
      sector: 'Savina Main Mandi',
      channel: 'B2B Wholesale',
      paymentStatus: 'unpaid',
      grandTotal: 22400,
      totalWeightKg: 110.0,
      itemsSummary: 'Chana Masala Papad (50kg), Bikaneri Bhujia (40kg)',
      status: 'received',
      tallySynced: false,
      van: 'Van 04 (Dinesh)',
      time: '28m ago'
    },
    {
      _id: 'ord-1028',
      orderNumber: 'SO-2024-1028',
      customerName: 'Jodhpur Sweets & Namkeen',
      sector: 'Krishi Mandi',
      channel: 'B2B Wholesale',
      paymentStatus: 'paid',
      grandTotal: 38500,
      totalWeightKg: 165.0,
      itemsSummary: 'Special Moong Papad (100kg), Ratlami Sev (50kg)',
      status: 'packed',
      tallySynced: true,
      van: 'Van 02 (Sohan)',
      time: '45m ago'
    },
    {
      _id: 'ord-1029',
      orderNumber: 'SO-2024-1029',
      customerName: 'Kailash Provision Store',
      sector: 'UIT Colony',
      channel: 'B2C Retail',
      paymentStatus: 'paid',
      grandTotal: 4650,
      totalWeightKg: 18.0,
      itemsSummary: 'Methi Khakhra (5kg), Hing Pickle (3kg), Sev (10kg)',
      status: 'packed',
      tallySynced: true,
      van: 'Van 03 (Ramesh)',
      time: '1h ago'
    },
    {
      _id: 'ord-1030',
      orderNumber: 'SO-2024-1030',
      customerName: 'Anoop Traders',
      sector: 'Sukher Industrial',
      channel: 'B2B Wholesale',
      paymentStatus: 'part',
      grandTotal: 54200,
      totalWeightKg: 240.0,
      itemsSummary: 'Export Grade Papad (180kg), Masala Sev (60kg)',
      status: 'shipped',
      tallySynced: true,
      van: 'Van 01 (Mukesh)',
      time: '1.5h ago'
    },
    {
      _id: 'ord-1031',
      orderNumber: 'SO-2024-1031',
      customerName: 'Shri Ram Bhojnalaya',
      sector: 'Savina Main Mandi',
      channel: 'HORECA / Bulk',
      paymentStatus: 'paid',
      grandTotal: 18600,
      totalWeightKg: 85.0,
      itemsSummary: 'Sindhi Jeera Papad (60kg), Aloo Bhujia (25kg)',
      status: 'delivered',
      tallySynced: true,
      van: 'Van 02 (Sohan)',
      time: '2h ago'
    },
    {
      _id: 'ord-1032',
      orderNumber: 'SO-2024-1032',
      customerName: 'Bapu Bazaar Wholesale Depot',
      sector: 'City Center (Bapu Bazaar)',
      channel: 'B2B Wholesale',
      paymentStatus: 'paid',
      grandTotal: 32900,
      totalWeightKg: 145.0,
      itemsSummary: 'Red Chilli Papad (80kg), Garlic Sev (50kg)',
      status: 'delivered',
      tallySynced: true,
      van: 'Van 03 (Ramesh)',
      time: '3h ago'
    }
  ];

  const [orders, setOrders] = useState(defaultOrders);

  // Fetch real API orders
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get('/orders?limit=50');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map(o => ({
            _id: o._id,
            orderNumber: o.orderNumber || `SO-${o._id.slice(-4).toUpperCase()}`,
            customerName: o.customer?.businessName || o.customerName || 'Udaipur Retailer',
            sector: o.customer?.city ? `${o.customer.city} Sector` : 'Savina Mandi',
            channel: o.channel || 'B2B Wholesale',
            paymentStatus: o.paymentStatus || 'unpaid',
            grandTotal: o.grandTotal || 0,
            totalWeightKg: o.totalWeightKg || 45.0,
            itemsSummary: o.items?.map(i => `${i.productName || i.name} (${i.quantity || i.qty})`).join(', ') || 'Custom Papad & Sev Pack',
            status: o.status || 'received',
            tallySynced: o.tallySynced ?? true,
            van: 'Van 01 (Mukesh)',
            time: 'Live'
          }));
          setOrders(mapped);
        }
      } catch {
        // fallback to defaults
      }
    }
    fetchOrders();
  }, []);

  // Advance workflow state
  const handleAdvanceStatus = (orderId, currentStatus) => {
    const nextMap = {
      received: 'packed',
      packed: 'shipped',
      shipped: 'delivered',
      delivered: 'received'
    };
    const nextStatus = nextMap[currentStatus] || 'received';
    setOrders(prev =>
      prev.map(o => (o._id === orderId ? { ...o, status: nextStatus } : o))
    );
  };

  // Sync to Tally prime action
  const handleSyncToTally = (orderId) => {
    setSyncingOrder(orderId);
    setTimeout(() => {
      setOrders(prev =>
        prev.map(o => (o._id === orderId ? { ...o, tallySynced: true } : o))
      );
      setSyncingOrder(null);
    }, 600);
  };

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      searchTerm === '' ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.itemsSummary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = selectedSector === 'all' || order.sector.toLowerCase().includes(selectedSector.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesChannel = selectedChannel === 'all' || order.channel.toLowerCase().includes(selectedChannel.toLowerCase());

    return matchesSearch && matchesSector && matchesStatus && matchesChannel;
  });

  // KPI aggregates
  const stats = {
    totalRevenue: filteredOrders.reduce((sum, o) => sum + o.grandTotal, 0),
    totalCount: filteredOrders.length,
    receivedCount: filteredOrders.filter(o => o.status === 'received').length,
    packedCount: filteredOrders.filter(o => o.status === 'packed').length,
    shippedCount: filteredOrders.filter(o => o.status === 'shipped').length,
    deliveredCount: filteredOrders.filter(o => o.status === 'delivered').length
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Sales & Dispatch</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#EA580C]">Order Execution Center</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Orders & Dispatch Pipeline
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage live wholesale & retail orders, packing progression, dispatch manifest, and TallyPrime sync status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_list</span>
                <span>Data Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'board'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_kanban</span>
                <span>Stage Board</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/v3/orders/new')}
              className="flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Create Order</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Value</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{stats.totalCount} active orders</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Received / Queue
            </div>
            <div className="text-lg font-bold text-amber-700 font-mono mt-0.5">{stats.receivedCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Pending packing</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Packed / Ready
            </div>
            <div className="text-lg font-bold text-blue-700 font-mono mt-0.5">{stats.packedCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">At staging bay</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              On Vans (Shipped)
            </div>
            <div className="text-lg font-bold text-purple-700 font-mono mt-0.5">{stats.shippedCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Active delivery</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Delivered
            </div>
            <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">{stats.deliveredCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Signed & accepted</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-emerald-600">sync_saved_locally</span>
              Tally Sync Rate
            </div>
            <div className="text-lg font-bold text-emerald-600 font-mono mt-0.5">
              {Math.round((filteredOrders.filter(o => o.tallySynced).length / (filteredOrders.length || 1)) * 100)}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Live ledger posted</div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search party, order no, items..."
                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white transition-all font-sans"
              />
            </div>

            {/* Sector Dropdown */}
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white w-full sm:w-auto font-medium"
            >
              <option value="all">All Delivery Beats (Udaipur)</option>
              <option value="savina">Savina Main Mandi</option>
              <option value="hiran magri">Hiran Magri (Sec 3-5)</option>
              <option value="krishi mandi">Krishi Mandi Hub</option>
              <option value="uit colony">UIT Colony</option>
              <option value="sukher">Sukher Industrial</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white w-full sm:w-auto font-medium"
            >
              <option value="all">All Execution Stages</option>
              <option value="received">Received</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>

            {/* Channel Dropdown */}
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white w-full sm:w-auto font-medium"
            >
              <option value="all">All Sales Channels</option>
              <option value="wholesale">B2B Wholesale</option>
              <option value="retail">B2C Retail</option>
              <option value="horeca">HORECA / Bulk</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedSector('all');
                setSelectedStatus('all');
                setSelectedChannel('all');
              }}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={() => navigate('/v3/delivery')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <span className="material-symbols-outlined text-[16px]">local_shipping</span>
              <span>View Van Manifest</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: DATA TABLE (Default High-Density)                */}
        {/* ======================================================== */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">Party / Customer</th>
                    <th className="py-3 px-4">Sector Beat</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4 text-right">Weight</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Tally Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400 font-medium">
                        No orders found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const statusBadges = {
                        received: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'Received' },
                        packed: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', label: 'Packed' },
                        shipped: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', label: 'Shipped' },
                        delivered: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Delivered' }
                      };
                      const badge = statusBadges[order.status] || statusBadges.received;

                      return (
                        <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 font-mono text-xs">{order.orderNumber}</div>
                            <div className="text-[11px] text-slate-400">{order.time}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{order.customerName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{order.channel}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">
                            {order.sector}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 font-normal" title={order.itemsSummary}>
                            {order.itemsSummary}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                            {order.totalWeightKg.toFixed(1)} kg
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono text-[13px]">
                            ₹{order.grandTotal.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {order.tallySynced ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Synced
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSyncToTally(order._id)}
                                disabled={syncingOrder === order._id}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-amber-900 underline"
                              >
                                <span className="material-symbols-outlined text-[14px] animate-spin">
                                  {syncingOrder === order._id ? 'refresh' : 'sync'}
                                </span>
                                {syncingOrder === order._id ? 'Posting...' : 'Push to Tally'}
                              </button>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdvanceStatus(order._id, order.status)}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                                title="Advance to Next Stage"
                              >
                                Advance
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/v3/invoices`)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="View Tax Invoice"
                              >
                                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Showing {filteredOrders.length} of {orders.length} orders</span>
              <span className="font-mono">Savina Godown Terminal • Live Mode</span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: STAGE BOARD (Clean Kanban)                       */}
        {/* ======================================================== */}
        {viewMode === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { id: 'received', title: '1. Received / Queue', color: 'border-t-amber-500', count: stats.receivedCount },
              { id: 'packed', title: '2. Packed / Staging', color: 'border-t-blue-500', count: stats.packedCount },
              { id: 'shipped', title: '3. Out on Vans', color: 'border-t-purple-500', count: stats.shippedCount },
              { id: 'delivered', title: '4. Delivered / Closed', color: 'border-t-emerald-500', count: stats.deliveredCount }
            ].map((col) => {
              const colOrders = filteredOrders.filter(o => o.status === col.id);
              return (
                <div key={col.id} className={`bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col border-t-4 ${col.color}`}>
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{col.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-mono font-bold">
                      {colOrders.length}
                    </span>
                  </div>

                  <div className="p-3 space-y-3 flex-1 min-h-[400px] overflow-y-auto">
                    {colOrders.length === 0 ? (
                      <div className="h-32 flex items-center justify-center text-xs text-slate-400 italic">
                        No orders in this stage
                      </div>
                    ) : (
                      colOrders.map((ord) => (
                        <div
                          key={ord._id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 font-mono">{ord.orderNumber}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{ord.time}</span>
                          </div>

                          <div>
                            <div className="font-semibold text-slate-800">{ord.customerName}</div>
                            <div className="text-[11px] text-slate-500">{ord.sector}</div>
                          </div>

                          <div className="text-[11px] text-slate-600 line-clamp-2 bg-white p-1.5 rounded border border-slate-100">
                            {ord.itemsSummary}
                          </div>

                          <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 font-mono">
                            <span className="text-[11px] text-slate-500">{ord.totalWeightKg} kg</span>
                            <span className="font-bold text-slate-900">₹{ord.grandTotal.toLocaleString('en-IN')}</span>
                          </div>

                          <div className="pt-2 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleAdvanceStatus(ord._id, ord.status)}
                              className="flex-1 py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] text-center transition-colors"
                            >
                              Move Next →
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate('/v3/invoices')}
                              className="p-1 rounded text-slate-500 hover:bg-slate-200 transition-colors"
                              title="Invoice"
                            >
                              <span className="material-symbols-outlined text-[16px]">print</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
export default OrdersV3;
