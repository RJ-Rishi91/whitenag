import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function InvoicesV3() {
  const navigate = useNavigate();
  const { id } = useParams();

  const invoice = {
    number: id ? `NF-INV-${id}` : 'NF-INV-2024-0891',
    date: '24 Oct 2024',
    dueDate: '31 Oct 2024',
    eWayBill: 'EW-8491-0921-UDZ',
    tallyVoucher: 'Voucher #8821 (Sales)',
    dispatchVan: 'Van 01 (Mukesh Sharma - RJ-27-GA-4890)',
    seller: {
      name: 'NAGFANI FOODS PVT. LTD.',
      sub: 'Manufacturers & Exporters of Traditional Rajasthani Papad & Namkeen',
      address: 'Plot No. 14-16, Krishi Upaj Mandi, Savina, Udaipur - 313002, Rajasthan',
      gstin: '08AABCN9402M1Z4',
      fssai: '12219034000412',
      state: 'Rajasthan',
      stateCode: '08',
      email: 'sales@nagfanifoods.com',
      phone: '+91 294 2489001'
    },
    buyer: {
      name: 'Sharma General Store',
      contactPerson: 'Mr. Ramesh Sharma',
      address: 'Plot 42, Hiran Magri Sector 3, Near BSNL Tower, Udaipur - 313002, Rajasthan',
      gstin: '08AAACS1421K1ZB',
      state: 'Rajasthan',
      stateCode: '08',
      phone: '+91 98290 12345'
    },
    items: [
      {
        sn: 1,
        desc: 'Urad Hari Mirch Papad (500g Poly Pouch)',
        hsn: '19059040',
        batch: 'BAT-2024-1014',
        qty: 60,
        unit: 'Pkt',
        rate: 65.0,
        amount: 3900.0,
        gstRate: 5
      },
      {
        sn: 2,
        desc: 'Methi Vacuum Khakhra (200g Box)',
        hsn: '19059090',
        batch: 'BAT-2024-1018',
        qty: 40,
        unit: 'Box',
        rate: 52.0,
        amount: 2080.0,
        gstRate: 5
      },
      {
        sn: 3,
        desc: 'Rajasthani Loung Sev (1kg Bulk Pouch)',
        hsn: '21069099',
        batch: 'BAT-2024-1021',
        qty: 20,
        unit: 'Kg',
        rate: 220.0,
        amount: 4400.0,
        gstRate: 12
      },
      {
        sn: 4,
        desc: 'Ker Sangri Traditional Aachar (500g Glass)',
        hsn: '20019000',
        batch: 'BAT-2024-1009',
        qty: 30,
        unit: 'Jar',
        rate: 155.0,
        amount: 4650.0,
        gstRate: 12
      }
    ],
    bank: {
      name: 'ICICI Bank Ltd.',
      branch: 'Chetak Circle, Udaipur',
      accountNo: '008205009182',
      ifsc: 'ICIC0000082'
    }
  };

  // Calculations
  const subtotal = invoice.items.reduce((sum, i) => sum + i.amount, 0);
  const tax5 = invoice.items.filter(i => i.gstRate === 5).reduce((sum, i) => sum + i.amount * 0.05, 0);
  const tax12 = invoice.items.filter(i => i.gstRate === 12).reduce((sum, i) => sum + i.amount * 0.12, 0);
  const totalGst = tax5 + tax12;
  const grandTotal = Math.round(subtotal + totalGst);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*Tax Invoice: ${invoice.number}*\nParty: ${invoice.buyer.name}\nAmount: ₹${grandTotal.toLocaleString('en-IN')}\nStatus: Dispatched via ${invoice.dispatchVan}`;
    window.open(`https://wa.me/919829012345?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex flex-col w-full pb-20">
      <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto w-full space-y-6">

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Billing</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span>Invoices</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#EA580C]">{invoice.number}</span>
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
              onClick={() => navigate('/v3/orders')}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Orders
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>WhatsApp PDF</span>
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
                {invoice.seller.name}
              </div>
              <div className="text-[11px] text-slate-600 font-medium max-w-md mt-0.5">
                {invoice.seller.sub}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                {invoice.seller.address}
              </div>
              <div className="text-[11px] text-slate-700 font-mono mt-1 space-x-3">
                <span><strong>GSTIN:</strong> {invoice.seller.gstin}</span>
                <span><strong>FSSAI:</strong> {invoice.seller.fssai}</span>
                <span><strong>State Code:</strong> 08 (Rajasthan)</span>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded">
                Tax Invoice
              </div>
              <div className="mt-3 text-right space-y-0.5">
                <div className="font-mono font-bold text-slate-900 text-sm">{invoice.number}</div>
                <div className="text-slate-500 text-[11px]">Date: <strong>{invoice.date}</strong></div>
                <div className="text-slate-500 text-[11px]">Due Date: <strong>{invoice.dueDate}</strong></div>
                <div className="text-slate-500 text-[11px] font-mono">E-Way: {invoice.eWayBill}</div>
              </div>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-2 gap-6 py-5 border-b border-slate-200">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Billed To (Customer / Party)
              </div>
              <div className="font-bold text-sm text-slate-900">{invoice.buyer.name}</div>
              <div className="text-slate-600 mt-0.5">{invoice.buyer.contactPerson}</div>
              <div className="text-slate-600 mt-0.5 text-[11px]">{invoice.buyer.address}</div>
              <div className="mt-2 text-[11px] font-mono space-y-0.5">
                <div><strong>GSTIN / UIN:</strong> {invoice.buyer.gstin}</div>
                <div><strong>State:</strong> {invoice.buyer.state} (Code: {invoice.buyer.stateCode})</div>
                <div><strong>Mobile:</strong> {invoice.buyer.phone}</div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Dispatch & Transport Details
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dispatch Vehicle:</span>
                <span className="font-semibold text-slate-900">{invoice.dispatchVan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tally Voucher:</span>
                <span className="font-mono font-semibold text-slate-900">{invoice.tallyVoucher}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Place of Supply:</span>
                <span className="font-semibold text-slate-900">Udaipur, Rajasthan (08)</span>
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
                  <th className="py-2 px-2 text-center">Batch</th>
                  <th className="py-2 px-2 text-right">Qty</th>
                  <th className="py-2 px-2 text-right">Rate (₹)</th>
                  <th className="py-2 px-2 text-center">GST</th>
                  <th className="py-2 px-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {invoice.items.map((item) => (
                  <tr key={item.sn}>
                    <td className="py-3 px-2 text-center font-mono text-slate-400">{item.sn}</td>
                    <td className="py-3 px-2 font-semibold text-slate-900">{item.desc}</td>
                    <td className="py-3 px-2 text-center font-mono text-slate-600">{item.hsn}</td>
                    <td className="py-3 px-2 text-center font-mono text-slate-500">{item.batch}</td>
                    <td className="py-3 px-2 text-right font-mono font-semibold">{item.qty} {item.unit}</td>
                    <td className="py-3 px-2 text-right font-mono">{item.rate.toFixed(2)}</td>
                    <td className="py-3 px-2 text-center font-mono">{item.gstRate}%</td>
                    <td className="py-3 px-2 text-right font-mono font-bold">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Breakup Grid */}
          <div className="border-t-2 border-slate-900 pt-4 grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-1">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Bank Remittance Details</div>
                <div>Bank Name: <strong>{invoice.bank.name}</strong></div>
                <div>Account No: <strong className="font-mono">{invoice.bank.accountNo}</strong></div>
                <div>IFSC Code: <strong className="font-mono">{invoice.bank.ifsc}</strong></div>
                <div>Branch: {invoice.bank.branch}</div>
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
                <span className="font-mono text-slate-800">₹{(totalGst / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>State GST (SGST):</span>
                <span className="font-mono text-slate-800">₹{(totalGst / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Total Tax Amount:</span>
                <span className="font-mono font-bold text-slate-900">₹{totalGst.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline">
                <span className="font-black text-sm uppercase text-slate-900">Grand Total:</span>
                <span className="font-mono text-xl font-black text-slate-900">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 italic text-right pt-0.5">
                (INR Seventeen Thousand Forty-Six Only)
              </div>

              <div className="pt-12 text-right">
                <div className="text-xs font-bold text-slate-900">For NAGFANI FOODS PVT. LTD.</div>
                <div className="text-[10px] text-slate-500 mt-8">Authorised Signatory / Partner</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
export default InvoicesV3;
