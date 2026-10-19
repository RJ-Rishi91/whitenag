import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function InvoiceV2() {
  const navigate = useNavigate();
  const { id } = useParams();

  const invoice = {
    number: id ? `NF-INV-${id}` : 'NF-INV-2024-0891',
    date: '24 Oct 2024',
    dueDate: '31 Oct 2024',
    eWayBill: 'EW-8491-0921',
    tallyVoucher: 'Voucher #8821',
    seller: {
      name: 'NAGFANI FOODS PVT. LTD.',
      tagline: 'Traditional Rajasthani Papad, Snacks & Condiments',
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
      name: 'HDFC Bank Ltd.',
      branch: 'Savina Mandi Branch, Udaipur',
      accountNumber: '50200088912401',
      ifsc: 'HDFC0004128'
    }
  };

  const taxableSubtotal = invoice.items.reduce((s, i) => s + i.amount, 0);
  const gst5Amount = invoice.items.filter(i => i.gstRate === 5).reduce((s, i) => s + (i.amount * 0.05), 0);
  const gst12Amount = invoice.items.filter(i => i.gstRate === 12).reduce((s, i) => s + (i.amount * 0.12), 0);
  const totalTax = gst5Amount + gst12Amount;
  const grandTotal = Math.round(taxableSubtotal + totalTax);

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
              {invoice.number}
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
              onClick={() => alert('Sending PDF invoice via WhatsApp to ' + invoice.buyer.phone)}
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
                    {invoice.seller.name}
                  </h2>
                  <p className="text-[11px] text-[#625B4F]">{invoice.seller.tagline}</p>
                </div>
              </div>
              <p className="text-[11px] text-[#625B4F] max-w-md mt-2">
                {invoice.seller.address}
              </p>
              <div className="text-[11px] text-[#03353A] font-semibold mt-1">
                <span>GSTIN: <strong>{invoice.seller.gstin}</strong></span>
                <span className="mx-2">•</span>
                <span>FSSAI: <strong>{invoice.seller.fssai}</strong></span>
              </div>
            </div>

            <div className="text-right sm:self-start">
              <span className="inline-block px-3 py-1 rounded bg-[#03353A] text-white font-outfit font-bold uppercase tracking-wider text-xs mb-2">
                Tax Invoice (B2B)
              </span>
              <div className="text-[11px] text-[#625B4F] space-y-0.5">
                <div>Invoice No: <strong className="text-[#111E20]">{invoice.number}</strong></div>
                <div>Date: <strong className="text-[#111E20]">{invoice.date}</strong></div>
                <div>State Code: <strong className="text-[#111E20]">08 (Rajasthan)</strong></div>
                <div>E-Way Bill: <strong className="text-[#111E20]">{invoice.eWayBill}</strong></div>
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
                {invoice.buyer.name}
              </h3>
              <p className="text-[11px] text-[#625B4F]">{invoice.buyer.address}</p>
              <div className="text-[11px] text-[#03353A] font-semibold pt-1">
                GSTIN: <strong>{invoice.buyer.gstin}</strong> · Phone: {invoice.buyer.phone}
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
                Payment: 7 Days Credit
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
                {invoice.items.map(i => (
                  <tr key={i.sn}>
                    <td className="py-3 px-3 font-mono text-[#625B4F]">{i.sn}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#111E20]">{i.desc}</div>
                      <div className="text-[10px] text-[#625B4F] font-mono">Batch: {i.batch}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#625B4F]">{i.hsn}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">{i.qty} {i.unit}</td>
                    <td className="py-3 px-3 text-right font-mono">{i.rate.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#111E20]">
                      {i.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{i.gstRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#E8F6F9] border border-[#CEDDDF] text-xs">
                <span className="font-bold text-[#03353A] block mb-1">Company Bank Details:</span>
                <div className="text-[11px] text-[#625B4F] space-y-0.5 font-mono">
                  <div>Bank: <strong>{invoice.bank.name}</strong></div>
                  <div>A/c No: <strong>{invoice.bank.accountNumber}</strong></div>
                  <div>IFSC: <strong>{invoice.bank.ifsc}</strong></div>
                  <div>Branch: {invoice.bank.branch}</div>
                </div>
              </div>

              <div className="text-[11px] text-[#625B4F] italic">
                Terms: Subject to Udaipur jurisdiction. Payment due within 7 days from invoice date. Goods once sold will not be taken back.
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
              <div className="text-[10px] text-right text-[#625B4F]">
                (Rupees Fifteen Thousand Thirty Only)
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
