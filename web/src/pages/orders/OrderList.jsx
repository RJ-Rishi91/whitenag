import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  Calendar,
  MapPin,
  ChevronRight,
  Eye
} from 'lucide-react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { SyncChip } from '../../components/SyncChip.jsx';
import { getSocket } from '../../api/socket.js';

export function OrderList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const activeTab = searchParams.get('status') || 'all';
  const selectedArea = searchParams.get('areaId') || '';

  const fetchOrders = async () => {
    try {
      const query = new URLSearchParams();
      if (activeTab && activeTab !== 'all') query.set('status', activeTab);
      if (selectedArea) query.set('areaId', selectedArea);
      if (search) query.set('search', search);

      const res = await api.get(`/orders?${query.toString()}`);
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load areas for filter
    api.get('/areas').then(res => {
      if (res.success) setAreas(res.data);
    });
  }, []);

  useEffect(() => {
    fetchOrders();

    const socket = getSocket();
    if (socket) {
      socket.on('order:created', fetchOrders);
      socket.on('order:status', fetchOrders);
    }
    return () => {
      if (socket) {
        socket.off('order:created');
        socket.off('order:status');
      }
    };
  }, [activeTab, selectedArea, search]);

  const handleStatusChange = async (orderId, newStatus, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/orders/${orderId}/status`, { status: newStatus });
      if (res.success) {
        fetchOrders();
      }
    } catch (err) {
      alert(err.message || 'Status transition failed');
    }
  };

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'received', label: 'Received', icon: Clock },
    { id: 'packed', label: 'Packed', icon: Package },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Orders & Dispatches
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            Area routing, packaging verification and delivery status
          </p>
        </div>

        <NavLink
          to="/orders/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Customer Order</span>
        </NavLink>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#EADBC8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  if (tab.id === 'all') p.delete('status');
                  else p.set('status', tab.id);
                  setSearchParams(p);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#03353A] text-white shadow-xs'
                    : 'text-[#837561] hover:bg-[#FFF8EC] hover:text-[#2B1B12]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Area Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Area dropdown */}
          <select
            value={selectedArea}
            onChange={(e) => {
              const p = new URLSearchParams(searchParams);
              if (e.target.value) p.set('areaId', e.target.value);
              else p.delete('areaId');
              setSearchParams(p);
            }}
            className="bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-2.5 py-1.5 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
          >
            <option value="">All Udaipur Areas</option>
            {areas.map(a => (
              <option key={a._id} value={a._id}>{a.name}</option>
            ))}
          </select>

          {/* Search input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-[#837561] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
            />
          </div>
        </div>
      </div>

      {/* Orders Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#837561]">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#2B1B12]">No orders found</h3>
          <p className="text-xs text-[#837561] mt-1">Try adjusting filters or create a new order.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            return (
              <div
                key={order._id}
                onClick={() => navigate(`/orders/${order._id}`)}
                className="card-surface p-4 hover:border-[#D9580B] hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-['Epilogue'] font-bold text-sm text-[#2B1B12]">
                      {order.orderNo}
                    </span>
                    <StatusBadge status={order.status} />
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                      {order.segment}
                    </span>
                    {order.challanNo && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                        Challan: {order.challanNo}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#837561]">
                    <span className="font-semibold text-[#2B1B12] truncate max-w-xs">
                      {order.partyId?.name || 'Customer'}
                    </span>
                    {order.areaId && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#D9580B]" />
                        <span>{order.areaId?.name}</span>
                      </span>
                    )}
                    <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Line items preview */}
                  <div className="mt-2 text-xs text-[#514534] truncate">
                    {order.items?.map(i => `${i.qty}x ${i.name}`).join(', ')}
                  </div>
                </div>

                {/* Right Totals & Quick Workflow Trigger */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#EADBC8]">
                  <div className="text-right">
                    <div className="text-base font-bold font-['Epilogue'] text-[#2B1B12] table-nums">
                      ₹{(order.grandTotal || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-[#837561] capitalize">
                      {order.paymentTerms || 'Cash'}
                    </div>
                  </div>

                  {/* Action step buttons */}
                  <div className="flex items-center gap-2">
                    {order.status === 'received' && (
                      <button
                        onClick={(e) => handleStatusChange(order._id, 'packed', e)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
                      >
                        Pack
                      </button>
                    )}

                    {order.status === 'packed' && (
                      <button
                        onClick={(e) => handleStatusChange(order._id, 'shipped', e)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
                      >
                        Ship
                      </button>
                    )}

                    {order.status === 'shipped' && (
                      <button
                        onClick={(e) => handleStatusChange(order._id, 'delivered', e)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                      >
                        Deliver
                      </button>
                    )}

                    <div className="p-2 text-[#837561] hover:text-[#D9580B] rounded-lg">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
