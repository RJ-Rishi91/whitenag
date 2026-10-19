import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingBag, Plus, Search, Calendar, ChevronRight } from 'lucide-react';
import { api } from '../../api/client.js';

export function PurchaseList() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/purchases');
        if (res.success) setPurchases(res.data);
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
            Raw Material Purchases & Inwards
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            Vendor supply bills, inward stock movements and payable ledgers
          </p>
        </div>

        <NavLink
          to="/purchases/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white text-xs font-semibold shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record New Purchase</span>
        </NavLink>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Purchase No</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Godown</th>
                <th className="py-3 px-4 text-right">Items</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#837561]">Loading purchases...</td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#837561]">No purchases recorded yet.</td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr key={p._id} className="hover:bg-[#FFF8EC]/30">
                    <td className="py-3 px-4 font-mono font-bold text-[#D9580B]">{p.purchaseNo}</td>
                    <td className="py-3 px-4 font-semibold text-[#2B1B12]">{p.supplierId?.name}</td>
                    <td className="py-3 px-4 font-mono text-[#837561]">{p.invoiceNo || '-'}</td>
                    <td className="py-3 px-4 text-[#837561]">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 text-[#514534]">{p.godownId?.name}</td>
                    <td className="py-3 px-4 text-right">{p.lines?.length || 0} Lines</td>
                    <td className="py-3 px-4 text-right font-bold table-nums text-[#2B1B12]">
                      ₹{p.grandTotal?.toLocaleString('en-IN')}
                    </td>
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
