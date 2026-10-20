import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function DeliveryV3() {
  const navigate = useNavigate();

  const [vans, setVans] = useState([
    {
      id: 'van-01',
      plate: 'RJ-27-GA-4890',
      driver: 'Mukesh Sharma',
      phone: '+91 98291 44552',
      route: 'Sec 3 & Mewar Industrial Belt',
      status: 'On Route',
      completedStops: 5,
      totalStops: 8,
      cashToCollect: 32500,
      cashCollected: 21500,
      loadWeightKg: 420,
      capacityKg: 650,
      currentStop: 'Sharma General Store (Plot 42, Sec 3)',
      eta: '10 mins',
      stops: [
        { id: 's1', customer: 'Vijay Kirana Store', sector: 'Sec 3', amount: 4800, weight: 45, status: 'delivered', time: '09:40 AM' },
        { id: 's2', customer: 'Shree Krishna Traders', sector: 'Sec 4', amount: 8200, weight: 70, status: 'delivered', time: '10:15 AM' },
        { id: 's3', customer: 'Deepak General Store', sector: 'Sec 3', amount: 3500, weight: 30, status: 'delivered', time: '10:50 AM' },
        { id: 's4', customer: 'Goyal Supermarket', sector: 'Sec 5', amount: 5000, weight: 55, status: 'delivered', time: '11:20 AM' },
        { id: 's5', customer: 'Sharma General Store', sector: 'Sec 3', amount: 11000, weight: 80, status: 'in-progress', time: 'ETA 11:45 AM' },
        { id: 's6', customer: 'Maheshwari Foods', sector: 'Mewar Ind.', amount: 0, weight: 140, status: 'pending', time: 'Pending' }
      ]
    },
    {
      id: 'van-02',
      plate: 'RJ-27-GB-1102',
      driver: 'Sohan Lal Gurjar',
      phone: '+91 94142 88910',
      route: 'Savina Krishi Mandi Wholesale',
      status: 'Loading Bay #2',
      completedStops: 0,
      totalStops: 9,
      cashToCollect: 44200,
      cashCollected: 0,
      loadWeightKg: 580,
      capacityKg: 700,
      currentStop: 'Main Godown Savina (Staging)',
      eta: 'Departing 11:30 AM',
      stops: [
        { id: 's20', customer: 'Mahalaxmi Kirana Mandir', sector: 'Savina', amount: 22400, weight: 110, status: 'pending', time: 'Queue' },
        { id: 's21', customer: 'Shri Ram Bhojnalaya', sector: 'Savina', amount: 18600, weight: 85, status: 'pending', time: 'Queue' }
      ]
    },
    {
      id: 'van-03',
      plate: 'RJ-27-GC-7741',
      driver: 'Ramesh Suthar',
      phone: '+91 98298 12093',
      route: 'UIT Colony & Chetak Circle',
      status: 'On Route',
      completedStops: 4,
      totalStops: 6,
      cashToCollect: 18400,
      cashCollected: 13750,
      loadWeightKg: 280,
      capacityKg: 500,
      currentStop: 'Fatehpura Main Market',
      eta: 'Arrived',
      stops: [
        { id: 's30', customer: 'Kailash Provision Store', sector: 'UIT Colony', amount: 4650, weight: 18, status: 'delivered', time: '10:05 AM' },
        { id: 's31', customer: 'Bapu Bazaar Depot', sector: 'City Center', amount: 9100, weight: 145, status: 'delivered', time: '10:45 AM' }
      ]
    },
    {
      id: 'van-04',
      plate: 'RJ-27-GD-9012',
      driver: 'Dinesh Menaria',
      phone: '+91 97841 00293',
      route: 'Hiran Magri (Sec 4 to 11)',
      status: 'On Route',
      completedStops: 2,
      totalStops: 7,
      cashToCollect: 28900,
      cashCollected: 9200,
      loadWeightKg: 390,
      capacityKg: 600,
      currentStop: 'Sector 6 Commercial Complex',
      eta: '15 mins',
      stops: [
        { id: 's40', customer: 'Choudhary Kirana', sector: 'Sec 6', amount: 9200, weight: 65, status: 'delivered', time: '11:10 AM' }
      ]
    }
  ]);

  const [selectedVanId, setSelectedVanId] = useState('van-01');

  const selectedVan = vans.find(v => v.id === selectedVanId) || vans[0];

  // Advance stop completion
  const handleMarkStopDelivered = (vanId, stopId) => {
    setVans(prev =>
      prev.map(v => {
        if (v.id === vanId) {
          const updatedStops = v.stops.map(s => (s.id === stopId ? { ...s, status: 'delivered', time: 'Delivered Just Now' } : s));
          const completedCount = updatedStops.filter(s => s.status === 'delivered').length;
          return {
            ...v,
            completedStops: completedCount,
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
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">4 Vans</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">3 on route • 1 loading at bay</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall Drops Completed</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {completedStopsAll} / {totalStopsAll}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {Math.round((completedStopsAll / totalStopsAll) * 100)}% route completion rate
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total COD Cash to Collect</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              ₹{totalFleetCash.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Across all Udaipur sectors</div>
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
              const percent = Math.round((van.completedStops / van.totalStops) * 100);
              const weightPercent = Math.round((van.loadWeightKg / van.capacityKg) * 100);

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

                  {/* Progress bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                      <span>Stops: {van.completedStops} of {van.totalStops}</span>
                      <span className="font-mono">{percent}% done</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Weight and cash metrics */}
                  <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans">Payload</div>
                      <div className="text-slate-700 font-semibold">{van.loadWeightKg} / {van.capacityKg} kg ({weightPercent}%)</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-sans">Cash in Van</div>
                      <div className="text-emerald-700 font-bold">₹{van.cashCollected.toLocaleString('en-IN')}</div>
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

              {selectedVan.stops.map((stop, idx) => {
                const isDelivered = stop.status === 'delivered';
                const isInProgress = stop.status === 'in-progress';

                return (
                  <div
                    key={stop.id}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors ${
                      isDelivered
                        ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                        : isInProgress
                        ? 'bg-amber-50/40 border-amber-300 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInProgress
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div>
                        <div className={`font-bold ${isDelivered ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {stop.customer}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {stop.sector} • Consignment: {stop.weight} kg
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
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
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          <span>Delivered</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Signed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
