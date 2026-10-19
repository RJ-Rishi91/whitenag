import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AlertTriangle, Phone, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';
import { api } from '../../api/client.js';

export function OutstandingList() {
  const [debtors, setDebtors] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/payments/outstanding');
        if (res.success) {
          setDebtors(res.data);
          setTotalOutstanding(res.totalOutstanding);
        }
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
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/payments')}
          className="p-2 rounded-xl bg-white border border-[#EADBC8] hover:bg-[#FFF8EC]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Customer Outstanding Receivables
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            Credit ledger dues and customer payment balances
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-[#FFF1EB] border border-[#EADBC8] flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#837561]">
            Total Outstanding Balance Across Udaipur
          </span>
          <div className="text-3xl font-bold font-['Epilogue'] text-[#7A1F2B] table-nums mt-1">
            ₹{totalOutstanding?.toLocaleString('en-IN') || 0}
          </div>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-[#D9580B] border border-[#EADBC8]">
          {debtors.length} Accounts Due
        </span>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Area</th>
                <th className="py-3 px-4 text-center">Credit Terms</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Outstanding (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#837561]">Loading outstanding dues...</td>
                </tr>
              ) : debtors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-emerald-700 font-bold">
                    Zero outstanding balance! All customer accounts are fully settled.
                  </td>
                </tr>
              ) : (
                debtors.map(d => (
                  <tr
                    key={d._id}
                    onClick={() => navigate(`/customers/${d._id}`)}
                    className="hover:bg-[#FFF8EC]/30 cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-[#2B1B12]">{d.name}</td>
                    <td className="py-3 px-4 text-stone-700 font-semibold">{d.mobile}</td>
                    <td className="py-3 px-4 text-[#837561]">{d.areaId?.name || 'Udaipur'}</td>
                    <td className="py-3 px-4 text-center">{d.creditDays || 0} Days</td>
                    <td className="py-3 px-4 text-right text-[#837561]">₹{(d.creditLimit || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold table-nums text-[#7A1F2B] text-sm">
                      ₹{d.balance.toLocaleString('en-IN')}
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
