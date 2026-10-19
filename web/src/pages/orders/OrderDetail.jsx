import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  MapPin,
  Phone,
  User,
  ExternalLink
} from 'lucide-react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { SyncChip } from '../../components/SyncChip.jsx';

export function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.success) {
        setOrder(res.data);
        setPaymentAmount(res.data.grandTotal - (res.data.paidAmount || 0));
      }
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusTransition = async (newStatus) => {
    try {
      const res = await api.post(`/orders/${id}/status`, { status: newStatus });
      if (res.success) {
        fetchOrder();
      }
    } catch (err) {
      alert(err.message || 'Status change failed');
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const res = await api.post(`/invoices/generate-from-order/${id}`);
      if (res.success) {
        navigate(`/invoices/${res.data._id}`);
      }
    } catch (err) {
      alert(err.message || 'Invoice generation failed');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    setSubmittingPayment(true);

    try {
      const res = await api.post(`/orders/${id}/payment`, {
        amount: Number(paymentAmount),
        mode: paymentMode,
        ref: paymentRef
      });
      if (res.success) {
        setPaymentModalOpen(false);
        fetchOrder();
      }
    } catch (err) {
      alert(err.message || 'Payment recording failed');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-[#837561]">Loading order details...</div>;
  }

  if (!order) {
    return <div className="p-12 text-center text-xs text-rose-600">Order not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-xl bg-white border border-[#EADBC8] hover:bg-[#FFF8EC] text-[#2B1B12]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
                Order {order.orderNo}
              </h2>
              <StatusBadge status={order.status} />
              <SyncChip status={order.sync?.status || 'synced'} />
            </div>
            <p className="text-xs text-[#837561] mt-0.5">
              Created on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {order.status === 'received' && (
            <button
              onClick={() => handleStatusTransition('packed')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
            >
              Mark Packed
            </button>
          )}

          {order.status === 'packed' && (
            <button
              onClick={() => handleStatusTransition('shipped')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
            >
              Mark Shipped (Out for Delivery)
            </button>
          )}

          {order.status === 'shipped' && (
            <button
              onClick={() => handleStatusTransition('delivered')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
            >
              Mark Delivered
            </button>
          )}

          {!order.invoiceId ? (
            <button
              onClick={handleGenerateInvoice}
              className="px-3.5 py-2 rounded-xl border border-[#EADBC8] bg-white hover:bg-[#FFF8EC] text-[#2B1B12] text-xs font-semibold flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-[#D9580B]" />
              <span>Generate Tax Invoice</span>
            </button>
          ) : (
            <NavLink
              to={`/invoices/${order.invoiceId}`}
              className="px-3.5 py-2 rounded-xl bg-[#03353A] hover:bg-[#022529] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>View Invoice</span>
            </NavLink>
          )}

          <button
            onClick={() => setPaymentModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4 stroke-[2]" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Grid: Order Items & Customer / Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Items & Totals (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-surface p-5 space-y-4">
            <h3 className="text-sm font-bold font-['Epilogue'] text-[#2B1B12] uppercase tracking-wider">
              Ordered SKUs & Quantities
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] tracking-wider">
                    <th className="pb-2">Item Description</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Rate</th>
                    <th className="pb-2 text-right">GST</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {order.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FFF8EC]/40">
                      <td className="py-2.5">
                        <p className="font-bold text-[#2B1B12]">{item.name}</p>
                        <p className="text-[10px] text-[#837561] font-mono">{item.sku}</p>
                      </td>
                      <td className="py-2.5 text-center font-bold">{item.qty} {item.unitSymbol}</td>
                      <td className="py-2.5 text-right font-medium">₹{item.rate}</td>
                      <td className="py-2.5 text-right text-[#837561]">{item.taxRate}%</td>
                      <td className="py-2.5 text-right font-bold table-nums">₹{Math.round(item.lineTotal).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Box */}
            <div className="pt-4 border-t border-[#EADBC8] space-y-2 text-xs">
              <div className="flex justify-between text-[#837561]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#2B1B12]">₹{order.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#837561]">
                <span>Taxes & GST:</span>
                <span className="font-semibold text-[#2B1B12]">₹{Math.round(order.taxTotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-bold font-['Epilogue'] text-[#2B1B12] pt-2 border-t border-stone-100">
                <span>Grand Total:</span>
                <span className="text-[#D9580B] table-nums">₹{Math.round(order.grandTotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-[#837561]">Payment Status:</span>
                <span className={`font-bold capitalize ${order.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {order.paymentStatus} (Paid ₹{(order.paidAmount || 0).toLocaleString('en-IN')})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Status Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Customer Summary Card */}
          <div className="card-surface p-5 space-y-3">
            <h3 className="text-xs font-bold text-[#837561] uppercase tracking-wider">
              Customer & Delivery Coordinates
            </h3>
            <div className="space-y-1.5 text-xs">
              <p className="text-sm font-bold text-[#2B1B12]">{order.partyId?.name}</p>
              <p className="text-[#514534] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#D9580B]" />
                <span>{order.partyId?.mobile}</span>
              </p>
              <p className="text-[#514534] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D9580B]" />
                <span>{order.partyId?.address || 'Udaipur'} ({order.areaId?.name || 'Area'})</span>
              </p>
              {order.partyId?.mapsUrl && (
                <a
                  href={order.partyId.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#03353A] hover:underline pt-1"
                >
                  <span>Open Delivery in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="card-surface p-5 space-y-3">
            <h3 className="text-xs font-bold text-[#837561] uppercase tracking-wider">
              Status Progression Timeline
            </h3>

            <div className="space-y-4 border-l-2 border-[#EADBC8] ml-2 pl-4 py-1 text-xs">
              {order.statusHistory?.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-[#D9580B] border-2 border-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2B1B12] uppercase tracking-wide">
                      {step.status}
                    </span>
                    <span className="text-[10px] text-[#837561]">
                      {new Date(step.at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {step.by && (
                    <p className="text-[11px] text-[#837561] mt-0.5">
                      Updated by {step.by?.name || 'Staff'}
                    </p>
                  )}
                  {step.note && (
                    <p className="text-[11px] text-stone-600 italic mt-0.5">{step.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#EADBC8] shadow-lg">
            <h3 className="text-base font-bold font-['Epilogue'] text-[#2B1B12] mb-1">
              Record Order Collection
            </h3>
            <p className="text-xs text-[#837561] mb-4">
              Enter amount collected by delivery driver or bank transfer
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#514534] mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-sm font-bold text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#514534] mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 outline-hidden focus:border-[#D9580B]"
                >
                  <option value="cash">Cash in Hand</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="bank">Bank Transfer / NEFT</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#514534] mb-1">Reference / UTR (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Cheque No"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 outline-hidden focus:border-[#D9580B]"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-[#EADBC8] hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 py-2 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white font-bold"
                >
                  {submittingPayment ? 'Recording...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
