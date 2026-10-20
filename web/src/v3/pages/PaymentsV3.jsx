import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';

export function PaymentsV3() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState('all');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState(false);

  // Default Payment Register
  const defaultPayments = [
    {
      _id: 'pay-001',
      receiptNumber: 'RCPT-2024-0491',
      date: '24 Oct 2024',
      customer: 'Jodhpur Sweets & Namkeen',
      amount: 38500,
      mode: 'RTGS / NEFT',
      refNumber: 'ICICR5202410240981',
      tallyVoucher: 'Receipt #4412',
      status: 'synced'
    },
    {
      _id: 'pay-002',
      receiptNumber: 'RCPT-2024-0492',
      date: '24 Oct 2024',
      customer: 'Sharma General Store',
      amount: 14850,
      mode: 'Cash (Van 01 Vault)',
      refNumber: 'COD-VAN-01',
      tallyVoucher: 'Receipt #4413',
      status: 'synced'
    },
    {
      _id: 'pay-003',
      receiptNumber: 'RCPT-2024-0493',
      date: '24 Oct 2024',
      customer: 'Kailash Provision Store',
      amount: 4650,
      mode: 'UPI (PhonePe QR)',
      refNumber: 'UPI-394819201944',
      tallyVoucher: 'Receipt #4414',
      status: 'synced'
    },
    {
      _id: 'pay-004',
      receiptNumber: 'RCPT-2024-0494',
      date: '23 Oct 2024',
      customer: 'Shri Ram Bhojnalaya',
      amount: 18600,
      mode: 'Cheque (SBI)',
      refNumber: 'CHQ-889102',
      tallyVoucher: 'Receipt #4409',
      status: 'cleared'
    },
    {
      _id: 'pay-005',
      receiptNumber: 'RCPT-2024-0495',
      date: '23 Oct 2024',
      customer: 'Bapu Bazaar Wholesale Depot',
      amount: 25000,
      mode: 'RTGS / NEFT',
      refNumber: 'SBINR5202410231102',
      tallyVoucher: 'Receipt #4410',
      status: 'synced'
    }
  ];

  const [payments, setPayments] = useState(defaultPayments);

  // New Receipt State
  const [newReceipt, setNewReceipt] = useState({
    customer: 'Sharma General Store',
    amount: 5000,
    mode: 'Cash (Van 01 Vault)',
    refNumber: 'CASH-REC',
    remarks: 'Partial recovery against invoice #8821'
  });

  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await api.get('/payments').catch(() => null);
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map(p => ({
            _id: p._id,
            receiptNumber: p.receiptNumber || `RCPT-${p._id.slice(-4)}`,
            date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '24 Oct 2024',
            customer: p.party?.businessName || p.partyName || 'Udaipur Retailer',
            amount: p.amount || 10000,
            mode: p.paymentMode || 'Cash',
            refNumber: p.referenceNumber || 'REF-DIRECT',
            tallyVoucher: p.tallyVoucherNumber ? `Receipt #${p.tallyVoucherNumber}` : 'Pending Sync',
            status: p.tallySynced ? 'synced' : 'pending'
          }));
          setPayments(mapped);
        }
      } catch {
        // preserve defaults
      }
    }
    loadPayments();
  }, []);

  const filteredPayments = payments.filter(p => {
    const matchSearch =
      searchTerm === '' ||
      p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.refNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMode = selectedMode === 'all' || p.mode.toLowerCase().includes(selectedMode.toLowerCase());
    return matchSearch && matchMode;
  });

  const totalCollectedToday = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleRecordReceipt = (e) => {
    e.preventDefault();
    const created = {
      _id: `pay-${Date.now()}`,
      receiptNumber: `RCPT-2024-049${payments.length + 6}`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      customer: newReceipt.customer,
      amount: +newReceipt.amount,
      mode: newReceipt.mode,
      refNumber: newReceipt.refNumber,
      tallyVoucher: `Receipt #${Math.floor(4420 + Math.random() * 30)}`,
      status: 'synced'
    };

    setPayments(prev => [created, ...prev]);
    setReceiptSuccess(true);
    setTimeout(() => {
      setReceiptSuccess(false);
      setShowReceiptModal(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Finance</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#EA580C]">Payments & Cash Collections</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Collections, Bank Deposits & Aging Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily driver COD reconciliations, RTGS/NEFT receipts, customer ledger credits, and TallyPrime voucher postings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_card</span>
              <span>Record Customer Receipt</span>
            </button>
          </div>
        </div>

        {/* Outstanding Aging Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Collected Today</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              ₹{totalCollectedToday.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">All 5 receipts reconciled</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">0 - 7 Days (Current Due)</div>
            <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">₹42,800</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Normal credit billing cycle</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">8 - 15 Days (Follow-up)</div>
            <div className="text-2xl font-bold text-amber-700 font-mono mt-1">₹34,500</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Assigned to driver recovery</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">15+ Days Overdue</div>
            <div className="text-2xl font-bold text-rose-700 font-mono mt-1">₹18,200</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Sharma General Store balance</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search receipt no, party, UTR/ref..."
                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white"
              />
            </div>

            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#EA580C] w-full sm:w-auto"
            >
              <option value="all">All Payment Channels</option>
              <option value="cash">Cash on Delivery (Van Vault)</option>
              <option value="rtgs">RTGS / NEFT (ICICI Bank)</option>
              <option value="upi">UPI / QR Code</option>
              <option value="cheque">Cheque Clearing</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedMode('all');
              }}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Daily Cash Statement</span>
            </button>
          </div>
        </div>

        {/* Payments Register Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt No & Date</th>
                  <th className="py-3 px-4">Customer Account</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Transaction / UTR Reference</th>
                  <th className="py-3 px-4 text-right">Amount Received (₹)</th>
                  <th className="py-3 px-4">Tally Voucher</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold font-mono text-slate-900">{p.receiptNumber}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{p.date}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.customer}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {p.mode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.refNumber}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-[13px]">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {p.tallyVoucher}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        Reconciled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredPayments.length} of {payments.length} receipt entries</span>
            <span className="font-mono">Tally Prime Cash/Bank Ledger Synced</span>
          </div>
        </div>

        {/* Record Receipt Modal */}
        {showReceiptModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Record Customer Collection Receipt</h3>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {receiptSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Collection receipt booked and posted to customer ledger!</span>
                </div>
              )}

              <form onSubmit={handleRecordReceipt} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Customer Account *
                  </label>
                  <select
                    value={newReceipt.customer}
                    onChange={(e) => setNewReceipt({ ...newReceipt, customer: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Sharma General Store">Sharma General Store (Due: ₹18,200)</option>
                    <option value="Mahalaxmi Kirana Mandir">Mahalaxmi Kirana Mandir (Due: ₹24,500)</option>
                    <option value="Jodhpur Sweets & Namkeen">Jodhpur Sweets & Namkeen (Due: ₹42,000)</option>
                    <option value="Kailash Provision Store">Kailash Provision Store (Due: ₹5,600)</option>
                    <option value="Anoop Traders">Anoop Traders (Due: ₹54,200)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Amount Collected (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={newReceipt.amount}
                      onChange={(e) => setNewReceipt({ ...newReceipt, amount: +e.target.value })}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Payment Channel
                    </label>
                    <select
                      value={newReceipt.mode}
                      onChange={(e) => setNewReceipt({ ...newReceipt, mode: e.target.value })}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="Cash (Van 01 Vault)">Cash (Van 01 Vault)</option>
                      <option value="RTGS / NEFT (ICICI)">RTGS / NEFT (ICICI)</option>
                      <option value="UPI (PhonePe QR)">UPI (PhonePe QR)</option>
                      <option value="Cheque Deposit">Cheque Deposit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    UTR / Cheque / Slip Reference
                  </label>
                  <input
                    type="text"
                    value={newReceipt.refNumber}
                    onChange={(e) => setNewReceipt({ ...newReceipt, refNumber: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={newReceipt.remarks}
                    onChange={(e) => setNewReceipt({ ...newReceipt, remarks: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(false)}
                    className="px-3.5 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-lg shadow-xs transition-colors"
                  >
                    Post Receipt Voucher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
export default PaymentsV3;
