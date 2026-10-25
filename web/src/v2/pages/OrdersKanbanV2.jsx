import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';

export function OrdersKanbanV2() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [filterSector, setFilterSector] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample seed / fallback orders matching Udaipur food distribution
  const defaultOrders = [];

  const [orders, setOrders] = useState([]);

  // Fetch real orders from API if available
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get('/orders?limit=50');
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map(o => ({
            _id: o._id,
            orderNumber: o.orderNumber || `SO-${o._id.slice(-4).toUpperCase()}`,
            customerName: o.customer?.businessName || o.customerName || 'Udaipur Retailer',
            sector: o.customer?.city ? `${o.customer.city} Sector` : 'Savina Mandi',
            channel: o.channel || 'b2b',
            paymentStatus: o.paymentStatus || 'unpaid',
            grandTotal: o.grandTotal || 0,
            totalWeightKg: o.totalWeightKg || 45.0,
            itemsSummary: o.items?.map(i => `${i.productName || i.name} (${i.quantity})`).join(', ') || 'Custom Papad & Sev Pack',
            status: o.status || 'received',
            tallySynced: o.tallySynced ?? true,
            van: 'Van 01 (Mukesh)',
            time: 'Live'
          }));
          setOrders(mapped);
        } else {
          setOrders([]);
        }
      } catch (err) {
        setOrders([]);
      }
    }
    fetchOrders();
  }, []);

  // Status progression action
  const handleAdvanceStatus = (orderId, currentStatus) => {
    const nextMap = {
      received: 'packed',
      packed: 'shipped',
      shipped: 'delivered',
      delivered: 'received'
    };
    const nextStatus = nextMap[currentStatus];
    setOrders(prev =>
      prev.map(o => (o._id === orderId ? { ...o, status: nextStatus } : o))
    );
    api.patch(`/orders/${orderId}/status`, { status: nextStatus }).catch(() => null);
  };

  const filteredOrders = orders.filter(o => {
    if (filterSector !== 'all' && !o.sector.toLowerCase().includes(filterSector.toLowerCase())) return false;
    if (filterChannel !== 'all' && o.channel !== filterChannel) return false;
    if (filterPayment !== 'all' && o.paymentStatus !== filterPayment) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.itemsSummary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const columns = [
    { key: 'received', title: 'Received', color: 'bg-blue-600', badgeColor: 'bg-blue-100 text-blue-800' },
    { key: 'packed', title: 'Packed', color: 'bg-amber-600', badgeColor: 'bg-amber-100 text-amber-800' },
    { key: 'shipped', title: 'Shipped', color: 'bg-purple-600', badgeColor: 'bg-purple-100 text-purple-800' },
    { key: 'delivered', title: 'Delivered', color: 'bg-emerald-600', badgeColor: 'bg-emerald-100 text-emerald-800' }
  ];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Dynamic Operational Stream Banner */}
      <div className="px-4 sm:px-8 pt-6 pb-2">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#FFDBCD] via-[#E2F1F3] to-[#BFEAF0] p-4 shadow-sm border border-[#EADBC8]/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#D9580B] animate-ping"></div>
              <span className="font-outfit font-bold text-sm text-[#111E20]">Live Savina Mandi Dispatch Stream</span>
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white text-[#D9580B] shadow-xs">
                3 New Direct Orders
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#594238]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#D9580B]">schedule</span>
                <span>Avg. Assembly Window: <strong className="text-[#111E20]">18m 40s</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#03353A]">local_shipping</span>
                <span>Van 04 Route: <strong className="text-[#111E20]">Savina → Krishi Mandi</strong></span>
              </div>
              <button
                onClick={() => navigate('/v2/delivery')}
                className="text-[#D9580B] hover:underline flex items-center gap-1 font-bold"
              >
                Review Stream <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Header & Control Strip */}
      <div className="px-4 sm:px-8 py-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#594238]">
                Fulfillment Matrix • Udaipur Hub
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#D7E5E7] text-[#111E20] text-[11px] font-semibold">
                Shift A (06:00 - 15:30)
              </span>
            </div>
            <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold text-[#111E20] tracking-tight">
              Orders &amp; Fulfillment
            </h1>
          </div>

          {/* Action Suite */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Toggle */}
            <div className="flex items-center bg-[#E8F6F9] p-1 rounded-xl border border-[#CEDDDF]">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-white text-[#03353A] shadow-xs' : 'text-[#625B4F]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">table_rows</span>
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'kanban' ? 'bg-white text-[#03353A] shadow-xs' : 'text-[#625B4F]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_kanban</span>
                <span>Kanban</span>
              </button>
            </div>

            <button
              onClick={() => navigate('/v2/delivery')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFF7EE] text-[#03353A] text-xs font-bold border border-[#EADBC8] transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px] text-[#03353A]">local_shipping</span>
              <span>Assign Van</span>
            </button>

            <button
              onClick={() => navigate('/v2/orders/new')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D9580B] hover:bg-[#BF4B07] text-white text-xs font-bold transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              <span>+ New Order (F2)</span>
            </button>
          </div>
        </div>

        {/* Filter & Drilldown Toolbar */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#EADBC8]/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Area Dropdown */}
            <div className="relative">
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="appearance-none h-9 pl-3 pr-8 rounded-xl bg-[#E8F6F9] text-[#111E20] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#D9580B] border border-[#CEDDDF]"
              >
                <option value="all">All Udaipur Sectors (14)</option>
                <option value="savina">SAVINA (Main Mandi)</option>
                <option value="sec 3">SEC 3 (Hiran Magri)</option>
                <option value="krishi">KRISHI MANDI</option>
                <option value="uit">UIT COLONY</option>
                <option value="sukher">SUKHER IND.</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#625B4F] text-[16px]">
                arrow_drop_down
              </span>
            </div>

            {/* B2B / B2C Segment */}
            <div className="flex items-center bg-[#E8F6F9] p-1 rounded-xl border border-[#CEDDDF]">
              <button
                onClick={() => setFilterChannel('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${filterChannel === 'all' ? 'bg-white shadow-xs text-[#03353A]' : 'text-[#625B4F]'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterChannel('b2b')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${filterChannel === 'b2b' ? 'bg-white shadow-xs text-[#03353A]' : 'text-[#625B4F]'}`}
              >
                B2B Trade
              </button>
              <button
                onClick={() => setFilterChannel('b2c')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${filterChannel === 'b2c' ? 'bg-white shadow-xs text-[#03353A]' : 'text-[#625B4F]'}`}
              >
                B2C Retail
              </button>
            </div>

            {/* Payment Chips */}
            <div className="hidden md:flex items-center gap-1 pl-2">
              <span className="text-[11px] font-bold text-[#625B4F] uppercase tracking-wider mr-1">Payment:</span>
              <button
                onClick={() => setFilterPayment(filterPayment === 'paid' ? 'all' : 'paid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  filterPayment === 'paid' ? 'bg-emerald-600 text-white' : 'bg-[#E8F6F9] text-[#03353A]'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setFilterPayment(filterPayment === 'part' ? 'all' : 'part')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  filterPayment === 'part' ? 'bg-amber-600 text-white' : 'bg-[#E8F6F9] text-[#03353A]'
                }`}
              >
                Part
              </button>
              <button
                onClick={() => setFilterPayment(filterPayment === 'unpaid' ? 'all' : 'unpaid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  filterPayment === 'unpaid' ? 'bg-red-600 text-white' : 'bg-[#E8F6F9] text-[#03353A]'
                }`}
              >
                Unpaid
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter order number or party..."
              className="h-9 pl-8 pr-3 bg-[#FFF7EE] rounded-xl text-xs border border-[#EADBC8] focus:outline-none focus:ring-1 focus:ring-[#D9580B]"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C7166] text-[16px]">
              search
            </span>
          </div>
        </div>
      </div>

      {/* Workspace View: Kanban Board */}
      {viewMode === 'kanban' ? (
        <div className="px-4 sm:px-8 pb-12 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {columns.map(col => {
              const colOrders = filteredOrders.filter(o => o.status === col.key);
              const colTotal = colOrders.reduce((sum, o) => sum + o.grandTotal, 0);
              const colWeight = colOrders.reduce((sum, o) => sum + o.totalWeightKg, 0);

              return (
                <div key={col.key} className="bg-[#E8F6F9]/60 border border-[#CEDDDF] rounded-2xl p-3.5 flex flex-col gap-3 shadow-xs">
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.color}`}></span>
                      <span className="font-outfit font-bold text-base text-[#111E20]">{col.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white text-xs font-bold text-[#111E20] shadow-xs">
                        {colOrders.length}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold text-[#625B4F] px-1 flex justify-between items-center border-b border-[#CEDDDF]/50 pb-2">
                    <span>Est. Weight: {colWeight.toFixed(0)} kg</span>
                    <span className="text-[#111E20] font-bold">₹{colTotal.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Cards List */}
                  <div className="flex flex-col gap-3 min-h-[300px]">
                    {colOrders.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#625B4F] border border-dashed border-[#CEDDDF] rounded-xl bg-white/50">
                        No orders in this stage
                      </div>
                    ) : (
                      colOrders.map(order => (
                        <div
                          key={order._id}
                          className="bg-white p-4 rounded-xl shadow-xs hover:shadow-md border border-[#EADBC8]/70 transition-all flex flex-col gap-2.5 group"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-outfit font-bold text-sm text-[#03353A]">
                                  {order.orderNumber}
                                </span>
                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${order.channel === 'b2b' ? 'bg-[#FFDBCD] text-[#9F3C00]' : 'bg-[#E2F1F3] text-[#03353A]'}`}>
                                  {order.channel}
                                </span>
                              </div>
                              <h3 className="font-outfit font-bold text-sm text-[#111E20] mt-0.5">
                                {order.customerName}
                              </h3>
                              <div className="text-[11px] text-[#625B4F] flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[13px] text-[#D9580B]">pin_drop</span>
                                <span>{order.sector}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-[#625B4F] font-mono">{order.time}</span>
                          </div>

                          {/* Items summary */}
                          <div className="text-xs text-[#594238] bg-[#FFF7EE] p-2 rounded-lg border border-[#EADBC8]/50 line-clamp-2">
                            {order.itemsSummary}
                          </div>

                          {/* Order Footer */}
                          <div className="flex items-center justify-between pt-1 border-t border-[#EADBC8]/40">
                            <div>
                              <span className="font-outfit font-extrabold text-sm text-[#111E20]">
                                ₹{order.grandTotal.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[11px] text-[#625B4F] ml-1.5">({order.totalWeightKg} kg)</span>
                            </div>

                            <button
                              onClick={() => handleAdvanceStatus(order._id, order.status)}
                              className="px-2.5 py-1 rounded-lg bg-[#03353A] hover:bg-[#D9580B] text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs"
                              title="Advance to next workflow stage"
                            >
                              <span>Advance</span>
                              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
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
        </div>
      ) : (
        /* Workspace View: Table */
        <div className="px-4 sm:px-8 pb-12 flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-[#EADBC8]/60 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#E8F6F9] text-[#625B4F] font-bold uppercase tracking-wider border-b border-[#CEDDDF]">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Party Name</th>
                  <th className="py-3.5 px-4">Sector</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Weight</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADBC8]/40 text-[#111E20]">
                {filteredOrders.map(o => (
                  <tr key={o._id} className="hover:bg-[#FFF7EE] transition-colors">
                    <td className="py-3.5 px-4 font-outfit font-bold text-[#03353A]">{o.orderNumber}</td>
                    <td className="py-3.5 px-4 font-semibold">{o.customerName}</td>
                    <td className="py-3.5 px-4 text-[#625B4F]">{o.sector}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[#594238]">{o.itemsSummary}</td>
                    <td className="py-3.5 px-4 font-mono">{o.totalWeightKg} kg</td>
                    <td className="py-3.5 px-4 font-outfit font-bold">₹{o.grandTotal.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E8F6F9] text-[#03353A]">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleAdvanceStatus(o._id, o.status)}
                        className="px-2.5 py-1 rounded bg-[#D9580B] text-white font-bold text-[11px] hover:bg-[#BF4B07]"
                      >
                        Advance →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
