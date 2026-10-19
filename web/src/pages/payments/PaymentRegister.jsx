import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CreditCard,
  Banknote,
  QrCode,
  Building,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../api/client.js';
import { MetricCard } from '../../components/MetricCard.jsx';

export function PaymentRegister() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const q = filterMode ? `?mode=${filterMode}` : '';
      const [payRes, sumRes] = await Promise.all([
        api.get(`/payments${q}`),
        api.get('/payments/cash-bank-summary')
      ]);

      if (payRes.success) setPayments(payRes.data);
      if (sumRes.success) setSummary(sumRes.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMode]);

  const filtered = payments.filter(p => {
    if (!search) return true;
    const custMatch = p.partyId?.name?.toLowerCase().includes(search.toLowerCase());
    const receiptMatch = p.receiptNo?.toLowerCase().includes(search.toLowerCase());
    const refMatch = p.ref?.toLowerCase().includes(search.toLowerCase());
    return custMatch || receiptMatch || refMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Daily Cash & Bank Register
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            Route cash handovers, digital UPI collections and customer credits
          </p>
        </div>

        <NavLink
          to="/outstanding"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EADBC8] bg-white hover:bg-[#FFF8EC] text-[#2B1B12] text-xs font-semibold self-start sm:self-auto"
        >
          <span>Customer Outstanding Debtors</span>
        </NavLink>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Physical Cash in Hand"
          value={`₹${(summary?.totalCash || 0).toLocaleString('en-IN')}`}
          subtext={`Today's Cash: ₹${(summary?.todayCash || 0).toLocaleString('en-IN')}`}
          icon={Banknote}
          color="primary"
        />

        <MetricCard
          title="Bank & UPI Balance"
          value={`₹${(summary?.totalBank || 0).toLocaleString('en-IN')}`}
          subtext={`Today's UPI: ₹${(summary?.todayUPI || 0).toLocaleString('en-IN')}`}
          icon={QrCode}
          color="teal"
        />

        <MetricCard
          title="Today's Total Collections"
          value={`₹${(summary?.todayCollection || 0).toLocaleString('en-IN')}`}
          subtext="Combined Cash & Digital"
          icon={CreditCard}
          color="emerald"
        />
      </div>

      {/* Filter and search */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#EADBC8] shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {['', 'cash', 'upi', 'bank', 'online'].map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all uppercase ${
                filterMode === mode ? 'bg-[#03353A] text-white' : 'text-[#837561] hover:bg-[#FFF8EC]'
              }`}
            >
              {mode === '' ? 'All Modes' : mode}
            </button>
          ))}
        </div>

        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 text-[#837561] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Receipt or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
          />
        </div>
      </div>

      {/* Transactions Register Table */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Party / Customer</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Reference / UTR</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#837561]">Loading payments...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#837561]">No payments found matching filter.</td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p._id} className="hover:bg-[#FFF8EC]/30">
                    <td className="py-3 px-4 font-mono font-bold text-[#D9580B]">{p.receiptNo}</td>
                    <td className="py-3 px-4 text-[#837561]">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 font-semibold text-[#2B1B12]">{p.partyId?.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                        {p.mode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#837561]">{p.ref || '-'}</td>
                    <td className="py-3 px-4 text-[#837561]">{p.recordedBy?.name || 'Staff'}</td>
                    <td className="py-3 px-4 text-right font-bold table-nums text-emerald-800 text-sm">
                      +₹{p.amount?.toLocaleString('en-IN')}
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
