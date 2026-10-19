import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Truck,
  MapPin,
  Printer,
  ExternalLink,
  Phone,
  CheckCircle2,
  Clock,
  Package,
  Calendar
} from 'lucide-react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export function DeliveryBoard() {
  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAreas() {
      try {
        const [areasRes, ordersRes] = await Promise.all([
          api.get('/areas'),
          api.get('/orders')
        ]);

        if (areasRes.success) {
          setAreas(areasRes.data);
          if (areasRes.data.length > 0) setSelectedAreaId(areasRes.data[0]._id);
        }
        if (ordersRes.success) {
          setOrders(ordersRes.data);
        }
      } catch (err) {
        console.error('Failed to load delivery board:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAreas();
  }, []);

  const selectedArea = areas.find(a => a._id === selectedAreaId);

  // Filter orders for the selected area that are active (packed, shipped, or delivered today)
  const areaOrders = orders.filter(o => {
    const areaMatch = o.areaId?._id === selectedAreaId || o.areaId === selectedAreaId;
    return areaMatch && (o.status === 'packed' || o.status === 'shipped' || o.status === 'received');
  });

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const res = await api.post(`/orders/${orderId}/status`, { status });
      if (res.success) {
        const updated = await api.get('/orders');
        if (updated.success) setOrders(updated.data);
      }
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Area-Wise Delivery Board
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            Van loading sheets, route clusters and driver delivery confirmations
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EADBC8] bg-white hover:bg-[#FFF8EC] text-[#2B1B12] text-xs font-semibold self-start sm:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4 text-[#D9580B]" />
          <span>Print Daily Run Sheet</span>
        </button>
      </div>

      {/* Area Chips Selector */}
      <div className="card-surface p-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#837561] block mb-2">
          Select Delivery Cluster
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {areas.map(area => {
            const isSelected = selectedAreaId === area._id;
            const countForArea = orders.filter(
              o => (o.areaId?._id === area._id || o.areaId === area._id) && o.status !== 'delivered' && o.status !== 'cancelled'
            ).length;

            return (
              <button
                key={area._id}
                onClick={() => setSelectedAreaId(area._id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#03353A] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-[#FFF8EC]'
                }`}
              >
                <span>{area.name}</span>
                {countForArea > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-[#E8A317] text-[#2B1B12]' : 'bg-stone-300 text-stone-800'}`}>
                    {countForArea}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Cluster Dispatch List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-['Epilogue'] text-[#2B1B12] flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#D9580B]" />
            <span>Dispatches for {selectedArea?.name || 'Selected Area'} ({areaOrders.length} Drops)</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#837561]">Loading area orders...</div>
        ) : areaOrders.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#2B1B12]">All deliveries cleared for this area!</h4>
            <p className="text-xs text-[#837561] mt-1">No pending or active dispatches in {selectedArea?.name}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {areaOrders.map(order => (
              <div
                key={order._id}
                className="card-surface p-5 flex flex-col justify-between hover:border-[#D9580B] transition-all space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-['Epilogue'] font-bold text-sm text-[#2B1B12]">
                      {order.orderNo}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>

                  <p className="text-sm font-bold text-[#2B1B12]">{order.partyId?.name}</p>

                  <div className="mt-2 space-y-1 text-xs text-[#837561]">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#D9580B]" />
                      <a href={`tel:${order.partyId?.mobile}`} className="hover:underline font-semibold text-[#2B1B12]">
                        {order.partyId?.mobile}
                      </a>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D9580B]" />
                      <span>{order.partyId?.address || 'Udaipur'}</span>
                    </p>
                    {order.challanNo && (
                      <p className="font-mono text-[11px] text-stone-700 bg-stone-100 inline-block px-1.5 py-0.5 rounded-sm">
                        DC: {order.challanNo}
                      </p>
                    )}
                  </div>

                  {/* Items list */}
                  <div className="mt-3 pt-3 border-t border-[#EADBC8] text-xs">
                    <span className="text-[10px] uppercase font-bold text-[#837561] block mb-1">
                      Package Contents:
                    </span>
                    <ul className="space-y-0.5 text-stone-700">
                      {order.items?.map((item, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{item.qty}x {item.name}</span>
                          <span className="font-semibold table-nums">₹{Math.round(item.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-[#EADBC8] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[#837561] block">To Collect:</span>
                    <span className="text-sm font-bold font-['Epilogue'] text-[#D9580B]">
                      ₹{Math.round(order.grandTotal).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.partyId?.mapsUrl && (
                      <a
                        href={order.partyId.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#03353A]"
                        title="Open in Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {order.status === 'received' && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'packed')}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                      >
                        Pack
                      </button>
                    )}

                    {order.status === 'packed' && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'shipped')}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                      >
                        Load & Ship
                      </button>
                    )}

                    {order.status === 'shipped' && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'delivered')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        Delivered ✓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
