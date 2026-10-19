import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Share2, Check, Download } from 'lucide-react';
import { api } from '../../api/client.js';

export function InvoicePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/invoices/${id}`);
        if (res.success) setInvoice(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-[#837561]">Loading invoice preview...</div>;
  }

  if (!invoice) {
    return <div className="p-12 text-center text-xs text-rose-600">Invoice not found.</div>;
  }

  const isB2B = invoice.type === 'b2b';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top action bar (hidden when printing) */}
      <div className="print:hidden flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 rounded-xl bg-white border border-[#EADBC8] hover:bg-[#FFF8EC]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold font-['Epilogue'] text-[#2B1B12]">
              {isB2B ? 'GST Tax Invoice' : 'Delivery Challan & Invoice'}
            </h2>
            <span className="text-xs text-[#837561] font-mono">{invoice.invoiceNo}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE INVOICE SHEET (Styled exactly to standard GST A4 formats) */}
      <div className="bg-white p-8 md:p-12 rounded-2xl border border-[#EADBC8] shadow-sm text-xs text-[#2B1B12] print:border-none print:shadow-none print:p-0">
        {/* Letterhead */}
        <div className="flex justify-between items-start pb-6 border-b border-[#EADBC8]">
          <div className="flex items-center gap-4">
            <img src="./logo.jpeg" alt="Nagfani Foods Logo" className="w-16 h-16 object-contain rounded-xl border border-stone-200 p-1" />
            <div>
              <h1 className="text-xl font-bold font-['Epilogue'] text-[#2B1B12]">NAGFANI FOODS</h1>
              <p className="text-[11px] text-[#514534]">Plot 42, Sukher Industrial Area, Udaipur - 313001 (Raj.)</p>
              <p className="text-[11px] text-[#514534]">FSSAI Lic No: 12221034000456</p>
              <p className="text-[11px] font-semibold text-[#03353A]">GSTIN: 08AABCN1234F1Z1 • State: Rajasthan (08)</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-[#FFF1EB] text-[#D9580B] font-bold text-xs rounded-md border border-[#EADBC8] mb-2 uppercase">
              {isB2B ? 'TAX INVOICE' : 'DELIVERY CHALLAN & INVOICE'}
            </span>
            <p className="text-sm font-bold font-mono text-[#2B1B12]">{invoice.invoiceNo}</p>
            <p className="text-[11px] text-[#837561]">Date: {new Date(invoice.date).toLocaleDateString('en-IN')}</p>
            {invoice.challanNo && (
              <p className="text-[11px] text-[#514534] font-mono mt-0.5">DC No: {invoice.challanNo}</p>
            )}
          </div>
        </div>

        {/* Bill To & Dispatch Coordinates */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b border-[#EADBC8]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#837561] block mb-1">
              Billed To (Buyer):
            </span>
            <p className="text-sm font-bold text-[#2B1B12]">{invoice.partyId?.name}</p>
            <p className="text-stone-600 mt-0.5">{invoice.partyId?.address || 'Udaipur'}</p>
            <p className="text-stone-600">Mobile: {invoice.partyId?.mobile}</p>
            {invoice.partyId?.gstin && (
              <p className="font-semibold text-[#03353A] mt-1">Buyer GSTIN: {invoice.partyId.gstin}</p>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#837561] block mb-1">
              Dispatch Coordinates:
            </span>
            <p className="text-stone-700">Place of Supply: <strong>Rajasthan (08)</strong></p>
            <p className="text-stone-700">Payment Terms: <strong>{invoice.orderId?.paymentTerms || 'Cash on Delivery'}</strong></p>
            <p className="text-stone-700">Area: <strong>{invoice.partyId?.areaId?.name || 'Udaipur'}</strong></p>
          </div>
        </div>

        {/* Goods Table */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#EADBC8]">
            <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#514534] uppercase text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3 border-r border-[#EADBC8] text-center w-10">#</th>
                <th className="py-2.5 px-3 border-r border-[#EADBC8]">Description of Goods</th>
                <th className="py-2.5 px-3 border-r border-[#EADBC8] text-center w-20">HSN</th>
                <th className="py-2.5 px-3 border-r border-[#EADBC8] text-center w-20">Qty</th>
                <th className="py-2.5 px-3 border-r border-[#EADBC8] text-right w-20">Rate (₹)</th>
                <th className="py-2.5 px-3 border-r border-[#EADBC8] text-right w-24">Taxable (₹)</th>
                <th className="py-2.5 px-3 border-r border-[#EADBC8] text-right w-20">GST</th>
                <th className="py-2.5 px-3 text-right w-24">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADBC8]">
              {invoice.lines?.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 border-r border-[#EADBC8] text-center text-[#837561]">{idx + 1}</td>
                  <td className="py-2.5 px-3 border-r border-[#EADBC8] font-bold text-[#2B1B12]">
                    {line.name}
                    <span className="block text-[10px] font-mono text-[#837561]">{line.sku}</span>
                  </td>
                  <td className="py-2.5 px-3 border-r border-[#EADBC8] text-center font-mono text-[#837561]">{line.hsn || '1905'}</td>
                  <td className="py-2.5 px-3 border-r border-[#EADBC8] text-center font-bold">{line.qty} {line.unitSymbol || 'pcs'}</td>
                  <td className="py-2.5 px-3 border-r border-[#EADBC8] text-right table-nums">₹{line.rate}</td>
                  <td className="py-2.5 px-3 border-r border-[#EADBC8] text-right font-medium table-nums">₹{Math.round(line.taxableAmount || (line.qty * line.rate)).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 border-r border-[#EADBC8] text-right text-[#837561]">{line.taxRate || 5}%</td>
                  <td className="py-2.5 px-3 text-right font-bold table-nums text-[#2B1B12]">₹{Math.round(line.lineTotal).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-[#EADBC8] font-bold bg-[#FFF8EC]/40">
              <tr>
                <td colSpan={5} className="py-2 px-3 text-right border-r border-[#EADBC8]">Taxable Subtotal:</td>
                <td className="py-2 px-3 text-right border-r border-[#EADBC8] table-nums">₹{Math.round(invoice.subtotal).toLocaleString('en-IN')}</td>
                <td className="py-2 px-3 text-right border-r border-[#EADBC8] text-[#837561]">CGST + SGST</td>
                <td className="py-2 px-3 text-right table-nums">₹{Math.round(invoice.taxTotal || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr className="bg-[#FFF1EB] text-sm text-[#D9580B]">
                <td colSpan={7} className="py-3 px-3 text-right border-r border-[#EADBC8]">Total Invoice Amount:</td>
                <td className="py-3 px-3 text-right table-nums font-['Epilogue']">₹{Math.round(invoice.grandTotal).toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Bank Details & Signature */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#EADBC8] items-end">
          <div className="space-y-1 text-[11px] text-[#514534]">
            <span className="font-bold text-[#2B1B12] block">Bank Payment Account (NEFT / RTGS):</span>
            <p>Bank: <strong>State Bank of India</strong></p>
            <p>Account Name: <strong>Nagfani Foods</strong></p>
            <p>A/C No: <strong>389201948501</strong></p>
            <p>IFSC: <strong>SBIN0001234</strong> (Branch: Madhuban, Udaipur)</p>
          </div>

          <div className="text-right space-y-12">
            <span className="font-bold text-[#2B1B12] block text-[11px]">For NAGFANI FOODS</span>
            <span className="text-[10px] text-[#837561] border-t border-stone-300 pt-1 inline-block min-w-44">
              Authorized Signatory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
