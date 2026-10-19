import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Factory, Plus, Calendar, Search, ChevronRight } from 'lucide-react';
import { api } from '../../api/client.js';

export function ProductionList() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/production');
        if (res.success) setEntries(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Manufacturing Journal & Batch Log
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            Production batches, BOM recipe scaling and raw material consumption variances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/boms"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EADBC8] bg-white hover:bg-[#FFF8EC] text-[#2B1B12] text-xs font-semibold"
          >
            <span>BOM Recipes</span>
          </NavLink>

          <NavLink
            to="/manufacturing/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#03353A] hover:bg-[#022529] text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Produce New Batch</span>
          </NavLink>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Journal No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Batch / Lot</th>
                <th className="py-3 px-4">Finished Product</th>
                <th className="py-3 px-4 text-center">Output Qty</th>
                <th className="py-3 px-4">Godown</th>
                <th className="py-3 px-4 text-center">Wastage</th>
                <th className="py-3 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#837561]">Loading production records...</td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#837561]">No production entries logged yet.</td>
                </tr>
              ) : (
                entries.map(entry => (
                  <tr key={entry._id} className="hover:bg-[#FFF8EC]/30">
                    <td className="py-3 px-4 font-mono font-bold text-[#D9580B]">{entry.productionNo}</td>
                    <td className="py-3 px-4 text-[#837561]">{new Date(entry.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-800">{entry.batchNo}</td>
                    <td className="py-3 px-4 font-semibold text-[#2B1B12]">{entry.productId?.name}</td>
                    <td className="py-3 px-4 text-center font-bold text-base font-['Epilogue'] text-[#03353A] table-nums">
                      {entry.qty} {entry.unitSymbol}
                    </td>
                    <td className="py-3 px-4 text-[#514534]">{entry.godownId?.name}</td>
                    <td className="py-3 px-4 text-center text-rose-700 font-semibold">{entry.wastage || 0}</td>
                    <td className="py-3 px-4 text-[#837561]">{entry.createdBy?.name || 'Staff'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
