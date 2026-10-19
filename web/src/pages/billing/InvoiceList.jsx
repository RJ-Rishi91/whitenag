import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Receipt, Search, Printer, Eye, ChevronRight } from 'lucide-react';
import { api } from '../../api/client.js';

export function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const q = new URLSearchParams();
        if (type) q.set('type', type);
        if (search) q.set('search', search);

        const res = await api.get(`/invoices?${q.toString()}`);
        if (res.success) setInvoices(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Billing, Tax Invoices & Delivery Challans
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            B2B GST compliant tax invoices and B2C dispatch delivery challans
          </p>
        </div>
      </div>

      {/* Filter and search */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#EADBC8] shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setType('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              type === '' ? 'bg-[#03353A] text-white' : 'text-[#837561] hover:bg-[#FFF8EC]'
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setType('b2b')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              type === 'b2b' ? 'bg-[#03353A] text-white' : 'text-[#837561] hover:bg-[#FFF8EC]'
            }`}
          >
            B2B GST Invoices
          </button>
          <button
            onClick={() => setType('b2c')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              type === 'b2c' ? 'bg-[#03353A] text-white' : 'text-[#837561] hover:bg-[#FFF8EC]'
            }`}
          >
            B2C Challans
          </button>
        </div>

        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 text-[#837561] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Invoice / Challan No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
          />
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Challan No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Taxable</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#837561]">Loading billing registers...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#837561]">No invoices generated yet. Generate an invoice from any customer order.</td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr
                    key={inv._id}
                    onClick={() => navigate(`/invoices/${inv._id}`)}
                    className="hover:bg-[#FFF8EC]/30 cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#D9580B]">{inv.invoiceNo}</td>
                    <td className="py-3 px-4 font-mono text-[#837561]">{inv.challanNo || '-'}</td>
                    <td className="py-3 px-4 font-semibold text-[#2B1B12]">{inv.partyId?.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                        {inv.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#837561]">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-medium">₹{inv.subtotal?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-[#837561]">₹{Math.round(inv.taxTotal || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold table-nums text-[#2B1B12]">
                      ₹{Math.round(inv.grandTotal).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-semibold text-[#D9580B] hover:underline flex items-center justify-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </span>
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
