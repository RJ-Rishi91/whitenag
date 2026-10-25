import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeliveryVanMotion } from '../animations/LottieAnimations.jsx';

export function DeliveryBoardV2() {
  const navigate = useNavigate();

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
      loadWeightKg: 0,
      capacityKg: 650,
      currentStop: 'Savina Main Depot',
      eta: 'Standby'
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
      loadWeightKg: 0,
      capacityKg: 700,
      currentStop: 'Savina Main Depot',
      eta: 'Standby'
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
      loadWeightKg: 0,
      capacityKg: 500,
      currentStop: 'Savina Main Depot',
      eta: 'Standby'
    },
    {
      id: 'van-04',
      plate: 'RJ-27-GD-9012',
      driver: 'Dinesh Gurjar',
      phone: '+91 97841 00293',
      route: 'Hiran Magri (Sec 4 to 11)',
      status: 'Ready / Standby',
      completedStops: 0,
      totalStops: 0,
      cashToCollect: 0,
      loadWeightKg: 0,
      capacityKg: 600,
      currentStop: 'Savina Main Depot',
      eta: 'Standby'
    }
  ]);

  const handleAdvanceVanStop = (vanId) => {
    setVans(prev =>
      prev.map(v => {
        if (v.id === vanId) {
          const nextCompleted = Math.min(v.totalStops, v.completedStops + 1);
          const nextStatus = nextCompleted === v.totalStops ? 'Completed' : 'On Route';
          return {
            ...v,
            completedStops: nextCompleted,
            status: nextStatus,
            cashToCollect: Math.max(0, v.cashToCollect - 6000)
          };
        }
        return v;
      })
    );
  };

  return (
    <div className="flex flex-col w-full pb-20">
      <div className="px-4 sm:px-8 py-8 space-y-8 max-w-[1600px] mx-auto w-full">
        
        {/* Top Action & Title Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D9580B] bg-[#FFDBCD] px-3 py-1 rounded-full">
                Fleet Dispatch Hub
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-[#594238] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Realtime GPS Telemetry Active
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold text-[#111E20] tracking-tight">
                Delivery &amp; Van Dispatch Board
              </h1>
              <span className="text-xs text-[#625B4F] font-medium">Udaipur City Fleet</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white text-[#111E20] border border-[#EADBC8] shadow-xs hover:bg-[#FFF7EE] transition-all text-xs font-bold"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Print Route Run Sheets</span>
            </button>
            <button
              onClick={() => navigate('/v2/orders/new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D9580B] text-white shadow-sm hover:bg-[#BF4B07] transition-all text-xs font-bold"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              <span>Assign New Delivery</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics Deck */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#625B4F]">Total Stops</span>
              <span className="material-symbols-outlined text-[#03353A] text-[22px]">pin_drop</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-outfit text-3xl font-extrabold text-[#111E20]">
                {vans.reduce((s, v) => s + v.totalStops, 0)}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F6F9] text-[#03353A]">
                All sectors
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#625B4F]">Out for Delivery</span>
              <span className="material-symbols-outlined text-[#D9580B] text-[22px]">local_shipping</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-outfit text-3xl font-extrabold text-[#D9580B]">
                {vans.reduce((s, v) => s + (v.totalStops - v.completedStops), 0)}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFDBCD] text-[#9F3C00]">
                {vans.filter(v => v.status === 'On Route').length} Dispatched
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#625B4F]">Active Drivers</span>
              <span className="material-symbols-outlined text-[#3B656A] text-[22px]">badge</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-outfit text-3xl font-extrabold text-[#111E20]">{vans.length}</span>
              <span className="text-[11px] font-bold text-emerald-700">Ready at Depot</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#625B4F]">Cash to Collect</span>
              <span className="material-symbols-outlined text-amber-600 text-[22px]">payments</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-outfit text-2xl font-extrabold text-[#111E20]">
                ₹{vans.reduce((s, v) => s + v.cashToCollect, 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] font-bold text-amber-800">Reconciled</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white shadow-sm border border-[#EADBC8]/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#625B4F]">Fleet Readiness</span>
              <span className="material-symbols-outlined text-emerald-600 text-[22px]">verified</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-outfit text-3xl font-extrabold text-emerald-700">100%</span>
              <span className="text-[11px] font-bold text-emerald-800">Operational</span>
            </div>
          </div>
        </div>

        {/* Animated Van Visualizer Strip */}
        <div className="bg-white rounded-2xl p-6 border border-[#EADBC8]/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-outfit font-bold text-lg text-[#111E20]">
              {vans.some(v => v.totalStops > 0) ? 'Live Dispatch Route in Motion' : 'Delivery Fleet on Standby'}
            </h3>
            <p className="text-xs text-[#625B4F]">
              {vans.some(v => v.totalStops > 0)
                ? 'Savina Mandi Godown → City Express Dispatch Runs'
                : 'All delivery vans stationed at Savina Mandi Central Godown ready for dispatch.'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <DeliveryVanMotion width={160} height={80} />
            <div className="text-right">
              <div className="font-outfit font-bold text-base text-[#D9580B]">
                {vans.some(v => v.totalStops > 0) ? 'Mukesh Sharma' : 'Savina Depot Standby'}
              </div>
              <div className="text-xs text-[#625B4F]">
                {vans.some(v => v.totalStops > 0) ? 'RJ-27-GA-4890 · Fleet Vehicle 01' : '4 Fleet Vehicles Available'}
              </div>
            </div>
          </div>
        </div>

        {/* Active Van Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vans.map(van => {
            const percent = van.totalStops > 0 ? Math.round((van.completedStops / van.totalStops) * 100) : 0;
            return (
              <div
                key={van.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#EADBC8]/70 flex flex-col justify-between gap-5 hover:shadow-md transition-all"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-[#EADBC8]/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E8F6F9] border border-[#CEDDDF] text-[#03353A] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[22px]">local_shipping</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-outfit font-bold text-base text-[#111E20]">{van.plate}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {van.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#625B4F] flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-[#111E20]">{van.driver}</span>
                          <span>•</span>
                          <span>{van.phone}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdvanceVanStop(van.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#D9580B] hover:bg-[#BF4B07] text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      <span>Next Drop</span>
                    </button>
                  </div>

                  {/* Route & Progress */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#625B4F]">Route: <strong className="text-[#111E20]">{van.route}</strong></span>
                      <span className="font-bold text-[#D9580B]">{percent}% Complete</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-[#E2F1F3] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D9580B] to-[#E8A317] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    {/* Current Destination */}
                    <div className="p-3 rounded-xl bg-[#FFF7EE] border border-[#EADBC8] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#D9580B] text-[18px]">location_on</span>
                        <div>
                          <span className="font-bold text-[#111E20] block">{van.currentStop}</span>
                          <span className="text-[11px] text-[#625B4F]">ETA: {van.eta}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#03353A] bg-white px-2 py-0.5 rounded border border-[#EADBC8]">
                        Stop {van.completedStops + 1} of {van.totalStops}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="pt-3 border-t border-[#EADBC8]/40 flex items-center justify-between text-xs text-[#625B4F]">
                  <div>
                    <span>Cash on Delivery: </span>
                    <strong className="text-[#111E20] font-outfit text-sm">₹{van.cashToCollect.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span>Payload: </span>
                    <strong className="text-[#111E20]">{van.loadWeightKg} / {van.capacityKg} kg</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
