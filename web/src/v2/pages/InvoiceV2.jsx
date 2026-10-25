import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';

export function InvoiceV2() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [invoices, setInvoices] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Seller details (Fixed Nagfani Foods Pvt Ltd profile)
  const seller = {
    name: 'NAGFANI FOODS PVT. LTD.',
    tagline: 'Traditional Rajasthani Papad, Snacks & Condiments',
    address: 'Plot No. 14-16, Krishi Upaj Mandi, Savina, Udaipur - 313002, Rajasthan',
    gstin: '08AABCN9402M1Z4',
    fssai: '12219034000412',
    state: 'Rajasthan',
    stateCode: '08',
    email: 'sales@nagfanifoods.com',
    phone: '+91 294 2489001',
    bank: {
      name: 'HDFC Bank Ltd.',
      branch: 'Savina Mandi Branch, Udaipur',
      accountNumber: '50200088912401',
      ifsc: 'HDFC0004128'
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (id) {
          const res = await api.get(`/invoices/${id}`);
          if (res?.success && res.data) {
            setCurrentInvoice(res.data);
          } else {
            setCurrentInvoice(null);
          }
        } else {
          const res = await api.get('/invoices');
          if (res?.success && Array.isArray(res.data)) {
            setInvoices(res.data);
            if (res.data.length > 0) {
              setCurrentInvoice(res.data[0]);
            } else {
              setCurrentInvoice(null);
            }
          } else {
            setInvoices([]);
            setCurrentInvoice(null);
          }
        }
      } catch (err) {
        console.warn('Failed to load invoice:', err);
        setCurrentInvoice(null);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col w-full pb-20 items-center justify-center p-12">
        <div className="w-8 h-8 border-3 border-[#D9580B] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-[#625B4F]">Loading Tax Invoices...</p>
      </div>
    );
  }

  // Clean empty state when no invoices exist
  if (!currentInvoice) {
    return (
      <div className="flex flex-col w-full pb-20">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF7EE] border border-[#EADBC8] text-[#D9580B] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">receipt_long</span>
          </div>
          <h2 className="font-outfit text-2xl font-bold text-[#111E20]">
            No Invoices Generated Yet
          </h2>
          <p className="text-xs text-[#625B4F] max-w-md mx-auto mt-2 mb-6">
            Tax invoices and delivery challans generated from dispatched sales orders will appear here automatically with GST compliance.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/v2/orders/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D9580B] text-white text-xs font-bold hover:bg-[#b54504] transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Create New Order</span>
            </button>
            <button
              onClick={() => navigate('/v2/orders')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#03353A] border border-[#EADBC8] text-xs font-bold hover:bg-[#FFF7EE] transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              <span>View Orders Kanban</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = currentInvoice.items || [];
  const taxableSubtotal = currentInvoice.subtotal || items.reduce((s, i) => s + (i.amount || (i.qty * i.rate) || 0), 0);
  const totalTax = currentInvoice.taxTotal || 0;
  const grandTotal = Math.round(currentInvoice.grandTotal || (taxableSubtotal + totalTax));
  const buyerName = currentInvoice.partyId?.name || currentInvoice.partyId?.businessName || 'Cash Customer';
  const buyerAddress = currentInvoice.partyId?.address || 'Udaipur, Rajasthan';
  const buyerGstin = currentInvoice.partyId?.gstin || 'Unregistered Person';
  const buyerPhone = currentInvoice.partyId?.mobile || currentInvoice.partyId?.phone || '';

  const handleShareWhatsApp = () => {
    const text = `*Tax Invoice: ${currentInvoice.invoiceNo}*\nParty: ${buyerName}\nAmount: ₹${grandTotal.toLocaleString('en-IN')}`;
    const cleanPhone = buyerPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col w-full pb-20">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-[#EADBC8]/60">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#03353A]">
              <span onClick={() => navigate('/v2/orders')} className="hover:text-[#D9580B] cursor-pointer">Orders</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#D9580B] font-bold">Tax Invoice</span>
            </div>
            <h1 className="font-outfit text-xl sm:text-2xl font-bold text-[#111E20] mt-1">
              {currentInvoice.invoiceNo || 'Tax Invoice'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E8F6F9] text-[#03353A] hover:bg-[#BCE7ED] text-xs font-bold transition-all border border-[#CEDDDF]"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print A4</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all border border-emerald-200"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => navigate('/v2/orders')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#03353A] text-white text-xs font-bold hover:bg-[#06484F] transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Orders</span>
            </button>
          </div>
        </div>

        {/* Paper Invoice Canvas (Rule 46 Compliant) */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-md border border-[#EADBC8] text-[#111E20] font-inter text-xs space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-[#111E20] gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D9580B] text-white flex items-center justify-center font-outfit font-extrabold text-xl shadow-xs">
                  NF
                </div>
                <div>
                  <h2 className="font-outfit font-extrabold text-xl sm:text-2xl text-[#03353A] tracking-wide">
                    {seller.name}
                  </h2>
                  <p className="text-[11px] text-[#625B4F]">{seller.tagline}</p>
                </div>
              </div>
              <p className="text-[11px] text-[#625B4F] max-w-md mt-2">
                {seller.address}
              </p>
              <div className="text-[11px] text-[#03353A] font-semibold mt-1">
                <span>GSTIN: <strong>{seller.gstin}</strong></span>
                <span className="mx-2">•</span>
                <span>FSSAI: <strong>{seller.fssai}</strong></span>
              </div>
            </div>

            <div className="text-right sm:self-start">
              <span className="inline-block px-3 py-1 rounded bg-[#03353A] text-white font-outfit font-bold uppercase tracking-wider text-xs mb-2">
                Tax Invoice (B2B)
              </span>
              <div className="text-[11px] text-[#625B4F] space-y-0.5">
                <div>Invoice No: <strong className="text-[#111E20]">{currentInvoice.invoiceNo}</strong></div>
                <div>Date: <strong className="text-[#111E20]">{currentInvoice.date ? new Date(currentInvoice.date).toLocaleDateString('en-IN') : '-'}</strong></div>
                <div>State Code: <strong className="text-[#111E20]">08 (Rajasthan)</strong></div>
                <div>E-Way Bill: <strong className="text-[#111E20]">{currentInvoice.eWayBill || '-'}</strong></div>
              </div>
            </div>
          </div>

          {/* Billed To / Shipped To Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-[#FFF7EE] border border-[#EADBC8]">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#625B4F]">
                Details of Receiver / Billed To:
              </span>
              <h3 className="font-outfit font-bold text-sm text-[#111E20]">
                {buyerName}
              </h3>
              <p className="text-[11px] text-[#625B4F]">{buyerAddress}</p>
              <div className="text-[11px] text-[#03353A] font-semibold pt-1">
                GSTIN: <strong>{buyerGstin}</strong> {buyerPhone && `· Phone: ${buyerPhone}`}
              </div>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#625B4F]">
                Place of Supply:
              </span>
              <div className="font-outfit font-bold text-sm text-[#111E20]">
                Udaipur, Rajasthan (Intra-State)
              </div>
              <div className="text-[11px] text-[#625B4F]">
                Reverse Charge: <strong>No</strong>
              </div>
              <div className="text-[11px] text-emerald-700 font-bold">
                Payment: Standard Credit
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto rounded-xl border border-[#EADBC8]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#E8F6F9] text-[#03353A] font-bold uppercase tracking-wider border-b border-[#CEDDDF]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Description of Goods</th>
                  <th className="py-2.5 px-3">HSN Code</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Taxable Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">GST %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADBC8]/50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#625B4F]">
                      No items recorded on this invoice.
                    </td>
                  </tr>
                ) : (
                  items.map((i, idx) => (
                    <tr key={i._id || idx}>
                      <td className="py-3 px-3 font-mono text-[#625B4F]">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#111E20]">{i.name || i.desc}</div>
                        {i.batch && <div className="text-[10px] text-[#625B4F] font-mono">Batch: {i.batch}</div>}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#625B4F]">{i.hsn || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">{i.qty} {i.unit || 'Units'}</td>
                      <td className="py-3 px-3 text-right font-mono">{(i.rate || 0).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#111E20]">
                        {(i.amount || (i.qty * i.rate) || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{i.taxRate || i.gstRate || 0}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#E8F6F9] border border-[#CEDDDF] text-xs">
                <span className="font-bold text-[#03353A] block mb-1">Company Bank Details:</span>
                <div className="text-[11px] text-[#625B4F] space-y-0.5 font-mono">
                  <div>Bank: <strong>{seller.bank.name}</strong></div>
                  <div>A/c No: <strong>{seller.bank.accountNumber}</strong></div>
                  <div>IFSC: <strong>{seller.bank.ifsc}</strong></div>
                  <div>Branch: {seller.bank.branch}</div>
                </div>
              </div>

              <div className="text-[11px] text-[#625B4F] italic">
                Terms: Subject to Udaipur jurisdiction. Payment due as per agreed credit terms. Goods once sold will not be taken back.
              </div>
            </div>

            {/* Calculations right */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#625B4F]">
                <span>Total Taxable Amount</span>
                <span className="font-mono font-bold text-[#111E20]">₹ {taxableSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#03353A] font-mono">
                <span>CGST (Intra-state)</span>
                <span>₹ {(totalTax / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#03353A] font-mono">
                <span>SGST (Rajasthan Intra-state)</span>
                <span>₹ {(totalTax / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-[#111E20] text-sm">
                <span className="font-outfit font-extrabold text-[#111E20]">Total Amount After Tax</span>
                <span className="font-outfit font-extrabold text-[#D9580B] text-lg">
                  ₹ {grandTotal.toLocaleString('en-IN')}.00
                </span>
              </div>
            </div>
          </div>

          {/* Signatory Footer */}
          <div className="pt-8 flex justify-between items-end border-t border-[#EADBC8]/70">
            <div className="text-[10px] text-[#625B4F]">
              This is a computer-generated tax invoice verified with TallyPrime ODBC.
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-[#111E20]">For NAGFANI FOODS PVT. LTD.</div>
              <div className="w-36 h-12 border-b border-dashed border-[#8C7166] ml-auto my-1"></div>
              <div className="text-[10px] text-[#625B4F]">Authorized Signatory</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
