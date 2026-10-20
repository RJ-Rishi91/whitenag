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
        { id: 's1', customer: 'Vijay Kirana Store', phone: '+91 98291 11223', sector: 'Sec 3', amount: 4800, weight: 45, status: 'delivered', time: '09:40 AM', instructions: 'Side door delivery, check seal' },
        { id: 's2', customer: 'Shree Krishna Traders', phone: '+91 98291 22334', sector: 'Sec 4', amount: 8200, weight: 70, status: 'delivered', time: '10:15 AM', instructions: 'Cash collected & signed by Mohanji' },
        { id: 's3', customer: 'Deepak General Store', phone: '+91 98291 33445', sector: 'Sec 3', amount: 3500, weight: 30, status: 'delivered', time: '10:50 AM', instructions: 'Hand over 5kg Papad sample pack' },
        { id: 's4', customer: 'Goyal Supermarket', phone: '+91 98291 44556', sector: 'Sec 5', amount: 5000, weight: 55, status: 'delivered', time: '11:20 AM', instructions: 'Direct to grocery billing desk' },
        { id: 's5', customer: 'Sharma General Store', phone: '+91 98291 55667', sector: 'Sec 3', amount: 0, weight: 60, status: 'delivered', time: '11:35 AM', instructions: 'Prepaid order invoice #1026' },
        { id: 's6', customer: 'Mewar Confectioners', phone: '+91 98291 66778', sector: 'Sec 4', amount: 6200, weight: 50, status: 'in-progress', time: 'ETA 11:55 AM', instructions: 'Near Mewar Circle, call on arrival' },
        { id: 's7', customer: 'Maheshwari Foods', phone: '+91 98291 77889', sector: 'Mewar Ind.', amount: 4800, weight: 110, status: 'pending', time: 'Pending', instructions: 'Unload at godown gate #3' },
        { id: 's8', customer: 'Balaji Retailers', phone: '+91 98291 88990', sector: 'Sec 3', amount: 0, weight: 30, status: 'pending', time: 'Pending', instructions: 'Credit customer, receive sign on DC' }
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
        { id: 's20', customer: 'Mahalaxmi Kirana Mandir', phone: '+91 94142 11001', sector: 'Savina Mandi', amount: 12400, weight: 90, status: 'pending', time: 'Queue', instructions: 'Heavy 50kg bags, use hand trolley' },
        { id: 's21', customer: 'Shri Ram Bhojnalaya', phone: '+91 94142 11002', sector: 'Savina Mandi', amount: 8600, weight: 75, status: 'pending', time: 'Queue', instructions: 'Restaurant kitchen side entrance' },
        { id: 's22', customer: 'Jodhpur Sweets Wholesale', phone: '+91 94142 11003', sector: 'Mandi Block A', amount: 9500, weight: 80, status: 'pending', time: 'Queue', instructions: 'Collect Cheque or Cash on Delivery' },
        { id: 's23', customer: 'Paras Provision Store', phone: '+91 94142 11004', sector: 'Savina Market', amount: 4200, weight: 45, status: 'pending', time: 'Queue', instructions: 'Shop opens at 12:00 PM noon' },
        { id: 's24', customer: 'Vardhman Traders', phone: '+91 94142 11005', sector: 'Mandi Gate 1', amount: 5500, weight: 60, status: 'pending', time: 'Queue', instructions: 'Immediate Cash on Delivery' },
        { id: 's25', customer: 'Mewar Grain Merchant', phone: '+91 94142 11006', sector: 'Subzi Mandi', amount: 4000, weight: 50, status: 'pending', time: 'Queue', instructions: 'Call Shri Ratan Lal prior to unload' },
        { id: 's26', customer: 'Karni Kripa Kirana', phone: '+91 94142 11007', sector: 'Savina Colony', amount: 0, weight: 70, status: 'pending', time: 'Queue', instructions: 'B2B Ledger account, invoice copy' },
        { id: 's27', customer: 'Nakoda Super Store', phone: '+91 94142 11008', sector: 'Mandi Road', amount: 0, weight: 50, status: 'pending', time: 'Queue', instructions: 'Collect 1 empty ghee container' },
        { id: 's28', customer: 'Ambika Namkeen Depot', phone: '+91 94142 11009', sector: 'Savina Bypass', amount: 0, weight: 60, status: 'pending', time: 'Queue', instructions: 'Drop off at loading dock #1' }
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
        { id: 's30', customer: 'Kailash Provision Store', phone: '+91 98298 11111', sector: 'UIT Colony', amount: 4650, weight: 18, status: 'delivered', time: '10:05 AM', instructions: 'Signed by Kailashji' },
        { id: 's31', customer: 'Bapu Bazaar Depot', phone: '+91 98298 22222', sector: 'City Center', amount: 9100, weight: 145, status: 'delivered', time: '10:45 AM', instructions: 'Cash placed in van vault' },
        { id: 's32', customer: 'Chetak Super Mart', phone: '+91 98298 33333', sector: 'Chetak Circle', amount: 0, weight: 35, status: 'delivered', time: '11:15 AM', instructions: 'Prepaid UPI transaction verified' },
        { id: 's33', customer: 'Lakecity Sweets', phone: '+91 98298 44444', sector: 'Hathipole', amount: 0, weight: 40, status: 'delivered', time: '11:35 AM', instructions: 'Verified batch packaging integrity' },
        { id: 's34', customer: 'Fatehpura Provision Store', phone: '+91 98298 55555', sector: 'Fatehpura', amount: 4650, weight: 42, status: 'in-progress', time: 'Arrived', instructions: 'Shop opposite HP petrol pump' },
        { id: 's35', customer: 'Sukhadia Circle Dairy & Kirana', phone: '+91 98298 66666', sector: 'Sukhadia Circle', amount: 0, weight: 40, status: 'pending', time: 'Pending', instructions: 'Delivery Challan #DC-1092' }
      ]
    },
    {
      id: 'van-04',
      plate: 'RJ-27-GD-9012',
      driver: 'Dinesh Gurjar (Delivery Logistics)',
      phone: '+91 98290 12348',
      route: 'Hiran Magri (Sec 4 to 11)',
      status: 'On Route',
      completedStops: 2,
      totalStops: 7,
      cashToCollect: 28900,
      cashCollected: 9200,
      loadWeightKg: 390,
      capacityKg: 600,
      currentStop: 'Gayatri General & Spices (Sec 8)',
      eta: '15 mins',
      stops: [
        { id: 's40', customer: 'Choudhary Kirana', phone: '+91 97841 00001', sector: 'Sec 6 Commercial', amount: 9200, weight: 65, status: 'delivered', time: '10:30 AM', instructions: 'Full cash collected & counted' },
        { id: 's41', customer: 'Mewar Traders', phone: '+91 97841 00002', sector: 'Sec 4', amount: 0, weight: 45, status: 'delivered', time: '11:00 AM', instructions: 'Prepaid order SO-1025' },
        { id: 's42', customer: 'Gayatri General & Spices', phone: '+91 97841 00003', sector: 'Sec 8 Main Market', amount: 7400, weight: 50, status: 'in-progress', time: 'ETA 11:45 AM', instructions: 'Unload at rear shutter, call owner prior' },
        { id: 's43', customer: 'Royal Namkeen Bhandar', phone: '+91 97841 00004', sector: 'Sec 5 Shopping Ctr', amount: 4800, weight: 40, status: 'pending', time: 'Queue', instructions: 'Collect cash + 2 empty plastic crates' },
        { id: 's44', customer: 'Jai Jinendra Kirana', phone: '+91 97841 00005', sector: 'Sec 9 Housing Board', amount: 3600, weight: 45, status: 'pending', time: 'Queue', instructions: 'Hand over stamped invoice copy to Shri Shantilal' },
        { id: 's45', customer: 'Shreenathji Super Store', phone: '+91 97841 00006', sector: 'Sec 11 Commercial', amount: 3900, weight: 65, status: 'pending', time: 'Queue', instructions: 'UPI QR payment on delivery' },
        { id: 's46', customer: 'Navkar Traders', phone: '+91 97841 00007', sector: 'Sec 4 Near Bus Stand', amount: 0, weight: 80, status: 'pending', time: 'Queue', instructions: 'B2B 15-day credit, get signature on DC' }
      ]
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

              {selectedVan.stops.map((stop, idx) => {
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
