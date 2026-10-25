import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore.js';

export function DeliveryV3() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isDeliveryDriver = user?.role?.code === 'DELIVERY' || user?.username === 'delivery';

  const [vans, setVans] = useState([
    {
      id: 'van-01',
      plate: 'RJ-27-GA-4890',
      driver: 'Mukesh Sharma',
      phone: '+91 98291 44552',
      route: 'Sec 3 & Mewar Industrial Belt',
      status: 'Ready / Standby',
      completedStops: 0,
      totalStops: 0,
      cashToCollect: 0,
      cashCollected: 0,
      loadWeightKg: 0,
      capacityKg: 650,
      currentStop: 'Savina Main Depot',
      eta: 'Standby',
      stops: []
    },
    {
      id: 'van-02',
      plate: 'RJ-27-GB-1102',
      driver: 'Sohan Lal Gurjar',
      phone: '+91 94142 88910',
      route: 'Savina Krishi Mandi Wholesale',
      status: 'Ready / Standby',
      completedStops: 0,
      totalStops: 0,
      cashToCollect: 0,
      cashCollected: 0,
      loadWeightKg: 0,
      capacityKg: 700,
      currentStop: 'Savina Main Depot',
      eta: 'Standby',
      stops: []
    },
    {
      id: 'van-03',
      plate: 'RJ-27-GC-7741',
      driver: 'Ramesh Suthar',
      phone: '+91 98298 12093',
      route: 'UIT Colony & Chetak Circle',
      status: 'Ready / Standby',
      completedStops: 0,
      totalStops: 0,
      cashToCollect: 0,
      cashCollected: 0,
      loadWeightKg: 0,
      capacityKg: 500,
      currentStop: 'Savina Main Depot',
      eta: 'Standby',
      stops: []
    },
    {
      id: 'van-04',
      plate: 'RJ-27-GD-9012',
      driver: 'Dinesh Gurjar (Delivery Logistics)',
      phone: '+91 98290 12348',
      route: 'Hiran Magri (Sec 4 to 11)',
      status: 'Ready / Standby',
      completedStops: 0,
      totalStops: 0,
      cashToCollect: 0,
      cashCollected: 0,
      loadWeightKg: 0,
      capacityKg: 600,
      currentStop: 'Savina Main Depot',
      eta: 'Standby',
      stops: []
    }
  ]);

  // Default to Dinesh's van if logged in as delivery driver
  const [selectedVanId, setSelectedVanId] = useState(isDeliveryDriver ? 'van-04' : 'van-01');

  useEffect(() => {
    if (isDeliveryDriver) {
      setSelectedVanId('van-04');
    }
  }, [isDeliveryDriver]);

  const selectedVan = vans.find(v => v.id === selectedVanId) || vans[0];

  // Advance stop completion with realistic cash & payload weight reconciliation
  const handleMarkStopDelivered = (vanId, stopId) => {
    setVans(prev =>
      prev.map(v => {
        if (v.id === vanId) {
          const targetStop = v.stops.find(s => s.id === stopId);
          if (!targetStop || targetStop.status === 'delivered') return v;

          const updatedStops = v.stops.map(s =>
            s.id === stopId
              ? { ...s, status: 'delivered', time: 'Delivered Just Now' }
              : s
          );
          const completedCount = updatedStops.filter(s => s.status === 'delivered').length;
          const additionalCash = targetStop.amount || 0;
          const newCashCollected = v.cashCollected + additionalCash;
          const remainingWeight = Math.max(0, v.loadWeightKg - (targetStop.weight || 0));

          return {
            ...v,
            completedStops: completedCount,
            cashCollected: newCashCollected,
            loadWeightKg: remainingWeight,
            status: completedCount === v.totalStops ? 'Completed' : 'On Route',
            stops: updatedStops
          };
        }
        return v;
      })
    );
  };

  // Fleet totals
  const totalFleetCash = vans.reduce((sum, v) => sum + v.cashToCollect, 0);
  const totalFleetCollected = vans.reduce((sum, v) => sum + v.cashCollected, 0);
  const totalStopsAll = vans.reduce((sum, v) => sum + v.totalStops, 0);
  const completedStopsAll = vans.reduce((sum, v) => sum + v.completedStops, 0);

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Logistics</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#EA580C]">Dispatch & Fleet Operations</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Vehicle Dispatch & Delivery Control
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor active delivery vans, route drop-offs, cash collections, and godown vehicle turnaround.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print Run Sheets</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/v3/orders')}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">view_list</span>
              <span>Back to Orders</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Fleet</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{vans.length} Vans</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
              {vans.filter(v => v.status === 'On Route').length} on route • {vans.filter(v => v.status !== 'On Route').length} available at depot
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall Drops Completed</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {completedStopsAll} / {totalStopsAll}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {totalStopsAll > 0 ? Math.round((completedStopsAll / totalStopsAll) * 100) : 0}% route completion rate
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total COD Cash to Collect</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              ₹{totalFleetCash.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Across all delivery routes</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Cash Collected (In Van Vaults)</div>
            <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">
              ₹{totalFleetCollected.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              ₹{(totalFleetCash - totalFleetCollected).toLocaleString('en-IN')} pending reconciliation
            </div>
          </div>
        </div>

        {/* Fleet Grid & Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Van Fleet Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Select Vehicle to Inspect Stops
            </div>

            {vans.map((van) => {
              const isSelected = van.id === selectedVanId;
              const percent = van.totalStops > 0 ? Math.round((van.completedStops / van.totalStops) * 100) : 0;
              const weightPercent = van.capacityKg > 0 ? Math.round((van.loadWeightKg / van.capacityKg) * 100) : 0;
              const isMyVan = isDeliveryDriver && van.id === 'van-04';

              return (
                <div
                  key={van.id}
                  onClick={() => setSelectedVanId(van.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-[#EA580C] shadow-md ring-2 ring-[#EA580C]/10'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{van.plate}</span>
                        <span className="text-[11px] font-normal text-slate-500">({van.driver})</span>
                        {isMyVan && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#EA580C] text-white uppercase tracking-wider">
                            My Van
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{van.route}</div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        van.status === 'On Route'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {van.status}
                    </span>
                  </div>

                  {/* Route completion Progress bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                      <span>Drops: {van.completedStops} of {van.totalStops}</span>
                      <span className="font-mono">{percent}% done</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Payload weight capacity meter */}
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                      <span className="text-[10px] text-slate-400 uppercase font-sans">Payload Capacity</span>
                      <span className="font-mono text-slate-700 font-semibold">{van.loadWeightKg} / {van.capacityKg} kg ({weightPercent}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          weightPercent > 85 ? 'bg-rose-500' : weightPercent > 70 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, weightPercent)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Cash metrics */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <div className="text-slate-500 text-[11px] font-sans">
                      Target: ₹{van.cashToCollect.toLocaleString('en-IN')}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-sans mr-1">Vault:</span>
                      <span className="text-emerald-700 font-bold">₹{van.cashCollected.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Detailed Route Stops for Selected Van (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{selectedVan.plate} — {selectedVan.driver}</span>
                  <a
                    href={`tel:${selectedVan.phone}`}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">call</span>
                    <span>{selectedVan.phone}</span>
                  </a>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Route: {selectedVan.route} • Next Stop: <strong className="text-slate-800">{selectedVan.currentStop}</strong>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-500">ETA: {selectedVan.eta}</span>
              </div>
            </div>

            {/* Stops Table */}
            <div className="p-4 flex-1 space-y-3 overflow-y-auto">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Scheduled Stops & Delivery Receipts
              </div>

              {selectedVan.stops.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">local_shipping</span>
                  <p className="font-semibold text-slate-700">No active delivery stops for this vehicle</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Stops will appear here once orders are dispatched from packing stations and allocated to this delivery route.
                  </p>
                </div>
              ) : (
                selectedVan.stops.map((stop, idx) => {
                  const isDelivered = stop.status === 'delivered';
                  const isInProgress = stop.status === 'in-progress';

                  return (
                    <div
                      key={stop.id}
                      className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isDelivered
                          ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                          : isInProgress
                          ? 'bg-amber-50/40 border-amber-300 text-slate-900'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800'
                              : isInProgress
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-bold ${isDelivered ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {stop.customer}
                            </span>
                            {stop.phone && (
                              <a
                                href={`tel:${stop.phone}`}
                                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded font-sans"
                                title="Call Customer"
                              >
                                <span className="material-symbols-outlined text-[12px]">call</span>
                                <span>Call</span>
                              </a>
                            )}
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop.customer}, ${stop.sector}, Udaipur`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded font-sans"
                              title="Navigate in Google Maps"
                            >
                              <span className="material-symbols-outlined text-[12px]">location_on</span>
                              <span>Maps</span>
                            </a>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {stop.sector} • Consignment: <strong className="text-slate-700">{stop.weight} kg</strong>
                          </div>

                          {stop.instructions && (
                            <div className="text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/60 rounded px-2 py-0.5 mt-1.5 inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-amber-600">info</span>
                              <span>{stop.instructions}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-right font-mono">
                          <div className="font-bold text-slate-900 text-xs">
                            {stop.amount > 0 ? `₹${stop.amount.toLocaleString('en-IN')}` : 'Credit / Prepaid'}
                          </div>
                          <div className="text-[10px] text-slate-400">{stop.time}</div>
                        </div>

                        {!isDelivered ? (
                          <button
                            type="button"
                            onClick={() => handleMarkStopDelivered(selectedVan.id, stop.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            <span>Delivered</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold px-2 py-1 rounded bg-emerald-50 border border-emerald-200">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Delivered &amp; Signed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Van vault cash reconciliation performed daily at Savina Main Godown (07:30 PM).
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-100 text-[11px]"
              >
                Print Manifest Slip
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
export default DeliveryV3;
