import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Filter, Calendar } from 'lucide-react';
import { api } from '../../api/client.js';

export function ReportsHub() {
  const [reportType, setReportType] = useState('sales');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/reports/${reportType}`);
        if (res.success) setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reportType]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Reports & Business Intelligence Hub
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            Operational summaries, sales registers, vendor purchases and production yields
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EADBC8] bg-white hover:bg-[#FFF8EC] text-[#2B1B12] text-xs font-semibold self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-[#D9580B]" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="card-surface p-3.5 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'sales', label: 'Sales & Dispatch Ledger' },
          { id: 'purchases', label: 'Raw Material Procurement' },
          { id: 'manufacturing', label: 'Manufacturing & Yield Log' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              reportType === tab.id
                ? 'bg-[#03353A] text-white shadow-xs'
                : 'text-[#837561] hover:bg-[#FFF8EC]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'sales' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Order No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map(o => (
                  <tr key={o._id} className="hover:bg-[#FFF8EC]/30">
                    <td className="py-3 px-4 font-mono font-bold text-[#D9580B]">{o.orderNo}</td>
                    <td className="py-3 px-4 text-[#837561]">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 font-semibold text-[#2B1B12]">{o.partyId?.name}</td>
                    <td className="py-3 px-4 text-[#837561]">{o.areaId?.name || 'Udaipur'}</td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold">{o.segment}</td>
                    <td className="py-3 px-4 capitalize font-semibold">{o.status}</td>
                    <td className="py-3 px-4 text-right font-bold table-nums">₹{Math.round(o.grandTotal).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'purchases' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Purchase No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Godown</th>
                  <th className="py-3 px-4 text-right">Items Count</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map(p => (
                  <tr key={p._id} className="hover:bg-[#FFF8EC]/30">
                    <td className="py-3 px-4 font-mono font-bold text-[#D9580B]">{p.purchaseNo}</td>
                    <td className="py-3 px-4 text-[#837561]">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 font-semibold text-[#2B1B12]">{p.supplierId?.name}</td>
                    <td className="py-3 px-4 text-[#514534]">{p.godownId?.name}</td>
                    <td className="py-3 px-4 text-right">{p.lines?.length || 0} Lines</td>
                    <td className="py-3 px-4 text-right font-bold table-nums">₹{Math.round(p.grandTotal).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'manufacturing' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Journal No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Batch No</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Godown</th>
                  <th className="py-3 px-4 text-center">Wastage</th>
                  <th className="py-3 px-4 text-right">Quantity Produced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map(e => (
                  <tr key={e._id} className="hover:bg-[#FFF8EC]/30">
                    <td className="py-3 px-4 font-mono font-bold text-[#D9580B]">{e.productionNo}</td>
                    <td className="py-3 px-4 text-[#837561]">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-800">{e.batchNo}</td>
                    <td className="py-3 px-4 font-semibold text-[#2B1B12]">{e.productId?.name}</td>
                    <td className="py-3 px-4 text-[#514534]">{e.godownId?.name}</td>
                    <td className="py-3 px-4 text-center text-rose-700 font-semibold">{e.wastage || 0}</td>
                    <td className="py-3 px-4 text-right font-bold font-['Epilogue'] text-base text-[#03353A] table-nums">
                      {e.qty} {e.unitSymbol}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
