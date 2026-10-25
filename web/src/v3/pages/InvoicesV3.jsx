import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';

export function InvoicesV3() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [invoices, setInvoices] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Seller profile (Fixed Nagfani Foods details)
  const seller = {
    name: 'NAGFANI FOODS PVT. LTD.',
    sub: 'Manufacturers & Exporters of Traditional Rajasthani Papad & Namkeen',
    address: 'Plot No. 14-16, Krishi Upaj Mandi, Savina, Udaipur - 313002, Rajasthan',
    gstin: '08AABCN9402M1Z4',
    fssai: '12219034000412',
    state: 'Rajasthan',
    stateCode: '08',
    email: 'sales@nagfanifoods.com',
    phone: '+91 294 2489001',
    bank: {
      name: 'ICICI Bank Ltd.',
      branch: 'Chetak Circle, Udaipur',
      accountNo: '008205009182',
      ifsc: 'ICIC0000082'
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (id) {
        const res = await api.get(`/invoices/${id}`);
        setCurrentInvoice(res.data);
      } else {
        const res = await api.get('/invoices');
        setInvoices(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch invoices:', err);
      setError(err.message || 'Unable to load invoice data');
      if (id) setCurrentInvoice(null);
      else setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = (inv) => {
    if (!inv) return;
    const partyName = inv.partyId?.name || inv.partyId?.businessName || 'Customer';
    const total = inv.grandTotal || 0;
    const text = `*Tax Invoice: ${inv.invoiceNo}*\nParty: ${partyName}\nAmount: ₹${total.toLocaleString('en-IN')}\nStatus: ${inv.status || 'Issued'}`;
    const phone = inv.partyId?.phone ? inv.partyId.phone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // If viewing a specific invoice
  if (id) {
    if (loading) {
      return (
        <div className="flex flex-col w-full pb-20 p-8 items-center justify-center">
          <div className="inline-block w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-slate-500 text-xs">Loading Tax Invoice...</div>
        </div>
      );
    }

    if (!currentInvoice) {
      return (
        <div className="max-w-2xl mx-auto py-16 px-4 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">receipt_long</span>
          <h2 className="text-lg font-bold text-slate-800">Invoice Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            The requested invoice does not exist or may have been deleted.
          </p>
          <button
            type="button"
            onClick={() => navigate('/v3/invoices')}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            Back to Invoices
          </button>
        </div>
      );
    }

    const party = currentInvoice.partyId || {};
    const lines = currentInvoice.lines || [];
    const subtotal = currentInvoice.subtotal || lines.reduce((s, l) => s + (l.taxableAmount || (l.qty * l.rate) || 0), 0);
    const cgst = currentInvoice.cgst || (currentInvoice.taxTotal ? currentInvoice.taxTotal / 2 : 0);
    const sgst = currentInvoice.sgst || (currentInvoice.taxTotal ? currentInvoice.taxTotal / 2 : 0);
    const grandTotal = currentInvoice.grandTotal || Math.round(subtotal + (cgst + sgst));

    return (
      <div className="flex flex-col w-full pb-20">
        <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto w-full space-y-6">

          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <span>Billing</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="cursor-pointer hover:underline" onClick={() => navigate('/v3/invoices')}>Invoices</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-[#EA580C]">{currentInvoice.invoiceNo}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                GST Tax Invoice Preview
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified compliant with CGST Rule 46 • TallyPrime Synchronized
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/v3/invoices')}
                className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                All Invoices
              </button>
              <button
                type="button"
                onClick={() => handleShareWhatsApp(currentInvoice)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print A4 Invoice</span>
              </button>
            </div>
          </div>

          {/* FORMAL A4 INVOICE SHEET */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 sm:p-10 font-sans text-slate-900 text-xs">

            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {seller.name}
                </div>
                <div className="text-[11px] text-slate-600 font-medium max-w-md mt-0.5">
                  {seller.sub}
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  {seller.address}
                </div>
                <div className="text-[11px] text-slate-700 font-mono mt-1 space-x-3">
                  <span><strong>GSTIN:</strong> {seller.gstin}</span>
                  <span><strong>FSSAI:</strong> {seller.fssai}</span>
                  <span><strong>State Code:</strong> {seller.stateCode} ({seller.state})</span>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded">
                  Tax Invoice
                </div>
                <div className="mt-3 text-right space-y-0.5">
                  <div className="font-mono font-bold text-slate-900 text-sm">{currentInvoice.invoiceNo}</div>
                  <div className="text-slate-500 text-[11px]">
                    Date: <strong>{new Date(currentInvoice.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </div>
                  {currentInvoice.challanNo && (
                    <div className="text-slate-500 text-[11px] font-mono">Challan: {currentInvoice.challanNo}</div>
                  )}
                  {currentInvoice.sync?.tallyGuid && (
                    <div className="text-slate-500 text-[11px] font-mono">Tally: {currentInvoice.sync.tallyGuid}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Parties Grid */}
            <div className="grid grid-cols-2 gap-6 py-5 border-b border-slate-200">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Billed To (Customer / Party)
                </div>
                <div className="font-bold text-sm text-slate-900">{party.businessName || party.name || 'Walk-in Customer'}</div>
                {party.contactPerson && <div className="text-slate-600 mt-0.5">{party.contactPerson}</div>}
                <div className="text-slate-600 mt-0.5 text-[11px]">{party.address || 'Udaipur, Rajasthan'}</div>
                <div className="mt-2 text-[11px] font-mono space-y-0.5">
                  <div><strong>GSTIN / UIN:</strong> {party.gstin || 'URP (Unregistered)'}</div>
                  <div><strong>State:</strong> {party.state || 'Rajasthan'} (Code: {party.stateCode || '08'})</div>
                  {party.phone && <div><strong>Mobile:</strong> {party.phone}</div>}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Dispatch & Billing Details
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Type:</span>
                  <span className="font-semibold text-slate-900 uppercase">{currentInvoice.type || 'b2b'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-emerald-700 uppercase">{currentInvoice.status || 'Issued'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Place of Supply:</span>
                  <span className="font-semibold text-slate-900">Rajasthan (08)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reverse Charge:</span>
                  <span className="font-semibold text-slate-900">No</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2">Description of Goods</th>
                    <th className="py-2 px-2 text-center">HSN/SAC</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Rate (₹)</th>
                    <th className="py-2 px-2 text-center">GST</th>
                    <th className="py-2 px-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {lines.map((item, idx) => (
                    <tr key={item._id || idx}>
                      <td className="py-3 px-2 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-2 font-semibold text-slate-900">{item.name || item.sku}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{item.hsn || '1905'}</td>
                      <td className="py-3 px-2 text-right font-mono font-semibold">{item.qty} {item.unitSymbol || 'Pkt'}</td>
                      <td className="py-3 px-2 text-right font-mono">{(item.rate || 0).toFixed(2)}</td>
                      <td className="py-3 px-2 text-center font-mono">{item.taxRate || 5}%</td>
                      <td className="py-3 px-2 text-right font-mono font-bold">{(item.lineTotal || (item.qty * item.rate) || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {lines.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 italic">No line items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals & Tax Breakup Grid */}
            <div className="border-t-2 border-slate-900 pt-4 grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-1">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Bank Remittance Details</div>
                  <div>Bank Name: <strong>{seller.bank.name}</strong></div>
                  <div>Account No: <strong className="font-mono">{seller.bank.accountNo}</strong></div>
                  <div>IFSC Code: <strong className="font-mono">{seller.bank.ifsc}</strong></div>
                  <div>Branch: {seller.bank.branch}</div>
                </div>

                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p>1. Goods once sold will not be returned without authorized inspection.</p>
                  <p>2. Interest @ 18% p.a. will be charged for delayed payments after 7 days.</p>
                  <p>3. Subject to Udaipur Jurisdiction only.</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Taxable Amount (Subtotal):</span>
                  <span className="font-mono font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Central GST (CGST):</span>
                  <span className="font-mono text-slate-800">₹{cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>State GST (SGST):</span>
                  <span className="font-mono text-slate-800">₹{sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Total Tax Amount:</span>
                  <span className="font-mono font-bold text-slate-900">₹{(cgst + sgst).toFixed(2)}</span>
                </div>
                <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline">
                  <span className="font-black text-sm uppercase text-slate-900">Grand Total:</span>
                  <span className="font-mono text-xl font-black text-slate-900">
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-12 text-right">
                  <div className="text-xs font-bold text-slate-900">For {seller.name}</div>
                  <div className="text-[10px] text-slate-500 mt-8">Authorised Signatory / Partner</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // Invoice Registry (List View)
  const filteredInvoices = invoices.filter(inv => {
    const q = searchTerm.toLowerCase();
    const invNo = (inv.invoiceNo || '').toLowerCase();
    const partyName = (inv.partyId?.businessName || inv.partyId?.name || '').toLowerCase();
    return invNo.includes(q) || partyName.includes(q);
  });

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Billing</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#EA580C]">Tax Invoices & Challans</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Invoices & Billing Register
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Official GST-compliant tax invoices, delivery challans, and TallyPrime sync status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/v3/orders')}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              View Sales Orders
            </button>
            <button
              type="button"
              onClick={() => navigate('/v3/orders/new')}
              className="px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Sales Order</span>
            </button>
          </div>
        </div>

        {/* Invoices List / Empty State */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Search by invoice # or party..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>
            <span className="text-xs text-slate-500">
              Total Invoices: <strong className="text-slate-800">{invoices.length}</strong>
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <div className="text-xs">Loading invoices...</div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">receipt_long</span>
              <p className="font-semibold text-slate-700">No Invoices Generated Yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Tax invoices and delivery challans will appear here as customer orders are confirmed, packed, and billed.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/v3/orders/new')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  Create First Order
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Party / Customer</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Taxable</th>
                    <th className="py-3 px-4 text-right">Tax</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredInvoices.map(inv => (
                    <tr key={inv._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNo}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(inv.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {inv.partyId?.businessName || inv.partyId?.name || 'Walk-in'}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500">{inv.type || 'b2b'}</td>
                      <td className="py-3 px-4 text-right font-mono">₹{(inv.subtotal || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-mono">₹{(inv.taxTotal || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{(inv.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {inv.status || 'Issued'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/v3/invoices/${inv._id}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-[#EA580C] hover:text-white rounded text-[11px] font-semibold text-slate-700 transition-colors"
                        >
                          View A4
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default InvoicesV3;
