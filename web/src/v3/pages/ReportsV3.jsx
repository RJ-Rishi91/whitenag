import React, { useState } from 'react';

export function ReportsV3() {
  const [dateRange, setDateRange] = useState('month');

  const sectorSales = [
    { sector: 'Savina Main Mandi', revenue: 64200, orders: 18, share: '34%' },
    { sector: 'Hiran Magri (Sec 3-5)', revenue: 47250, orders: 14, share: '25%' },
    { sector: 'Krishi Mandi Hub', revenue: 38500, orders: 8, share: '20%' },
    { sector: 'Sukher Industrial Area', revenue: 26800, orders: 5, share: '14%' },
    { sector: 'UIT Colony & Chetak', revenue: 13250, orders: 7, share: '7%' }
  ];

  const productMargins = [
    { name: 'Urad Special Masala Papad (500g)', unitsSold: 420, revenue: 27300, cogs: 16800, margin: '38.5%' },
    { name: 'Rajasthani Loung Sev (1kg Bulk)', unitsSold: 180, revenue: 39600, cogs: 23400, margin: '40.9%' },
    { name: 'Methi Vacuum Khakhra (200g)', unitsSold: 260, revenue: 13520, cogs: 8320, margin: '38.5%' },
    { name: 'Ker Sangri Aachar (500g Glass)', unitsSold: 85, revenue: 13175, cogs: 7225, margin: '45.2%' },
    { name: 'Bikaneri Bhujia Fine (1kg)', unitsSold: 110, revenue: 23100, cogs: 14300, margin: '38.1%' }
  ];

  const plSummary = {
    grossRevenue: 189950,
    rawMaterialCost: 108450,
    packagingCost: 12400,
    fleetLogisticsFuel: 8600,
    grossProfit: 60500,
    marginPercent: '31.8%'
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Finance</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#EA580C]">Executive Reports & P&L</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Operational Profitability & Sales Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Sector dispatch performance, SKU contribution margins, and Tally-reconciled monthly P&L statement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
            >
              <option value="today">Today (24 Oct 2024)</option>
              <option value="week">Current Week (18 - 24 Oct)</option>
              <option value="month">Current Month (October 2024)</option>
              <option value="fy">Financial Year 2024-25</option>
            </select>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Export P&L Report</span>
            </button>
          </div>
        </div>

        {/* P&L Financial Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gross Sales Turnover</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              ₹{plSummary.grossRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">↑ 14.2% vs previous month</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cost of Goods (COGS)</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              ₹{(plSummary.rawMaterialCost + plSummary.packagingCost).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Raw dal, oil, spices & pouches</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Gross Contribution</div>
            <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">
              ₹{plSummary.grossProfit.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">{plSummary.marginPercent} blended margin</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fleet & Distribution Fuel</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              ₹{plSummary.fleetLogisticsFuel.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">4 delivery vans in Udaipur</div>
          </div>
        </div>

        {/* 2-Column Analytics Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Sector Route Breakdown (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Revenue by Delivery Beat (Udaipur)</h3>
              <span className="text-[11px] font-mono text-slate-400">Total ₹1,89,950</span>
            </div>

            <div className="space-y-3.5">
              {sectorSales.map((sec, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="font-semibold text-slate-800">{sec.sector}</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{sec.revenue.toLocaleString('en-IN')} ({sec.share})
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EA580C] rounded-full"
                      style={{ width: sec.share }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right">
                    {sec.orders} deliveries completed
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: SKU Contribution Margin Analysis (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Product Profit Margin Breakdown</h3>
              <span className="text-[11px] font-mono text-slate-400">Manufactured In-House</span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-right">Volume</th>
                    <th className="py-2.5 px-3 text-right">Revenue (₹)</th>
                    <th className="py-2.5 px-3 text-right">COGS (₹)</th>
                    <th className="py-2.5 px-3 text-center">Gross Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {productMargins.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {prod.name}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {prod.unitsSold}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{prod.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        ₹{prod.cogs.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {prod.margin}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
              <span>Financial Data Grounded in TallyPrime Ledger Balances</span>
              <span className="font-mono">FY 2024-25 Q3</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
export default ReportsV3;
