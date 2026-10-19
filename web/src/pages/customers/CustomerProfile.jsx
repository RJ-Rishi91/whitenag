import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  ExternalLink,
  CreditCard,
  Receipt,
  Clock,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [rateHistory, setRateHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ledger');

  useEffect(() => {
    async function loadProfile() {
      try {
        const [partyRes, ledgerRes, ratesRes] = await Promise.all([
          api.get(`/parties/${id}`),
          api.get(`/parties/${id}/ledger`),
          api.get(`/parties/${id}/rates`)
        ]);

        if (partyRes.success) {
          setCustomer(partyRes.data);
          setOrders(partyRes.recentOrders || []);
        }
        if (ledgerRes.success) {
          setLedger(ledgerRes.ledger || []);
        }
        if (ratesRes.success) {
          setRateHistory(ratesRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-[#837561]">Loading customer account...</div>;
  }

  if (!customer) {
    return <div className="p-12 text-center text-xs text-rose-600">Customer record not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 rounded-xl bg-white border border-[#EADBC8] hover:bg-[#FFF8EC] text-[#2B1B12]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
              {customer.name}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#03353A] text-white">
              {customer.segment} • {customer.b2bType}
            </span>
          </div>
          <p className="text-xs text-[#837561] mt-0.5">
            GSTIN: {customer.gstin || 'Unregistered'} • Credit Limit: ₹{(customer.creditLimit || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="card-surface p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#837561] block mb-1">
            Contact & Location
          </span>
          <p className="text-sm font-semibold text-[#2B1B12] flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-[#D9580B]" />
            <a href={`tel:${customer.mobile}`} className="hover:underline">{customer.mobile}</a>
          </p>
          <p className="text-xs text-[#514534] mt-1 flex items-start gap-1.5">
            <MapPin className="w-4 h-4 text-[#D9580B] shrink-0 mt-0.5" />
            <span>{customer.address || 'Udaipur'} ({customer.areaId?.name || 'Area'})</span>
          </p>
          {customer.mapsUrl && (
            <a
              href={customer.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#03353A] hover:underline mt-2"
            >
              <span>Open in Google / Apple Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#837561] block mb-1">
            Terms & Commercials
          </span>
          <div className="text-xs space-y-1 text-[#514534]">
            <p>Payment Credit Terms: <strong className="text-[#2B1B12]">{customer.creditDays || 0} Days</strong></p>
            <p>Registered Area: <strong className="text-[#2B1B12]">{customer.areaId?.name || 'Udaipur'}</strong></p>
            <p>Pincode: <strong className="text-[#2B1B12]">{customer.pincode || '313001'}</strong></p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FFF8EC] border border-[#EADBC8] flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#837561]">Current Ledger Balance</span>
          <div className="text-2xl font-bold font-['Epilogue'] text-[#7A1F2B] table-nums mt-1">
            ₹{customer.balance?.toLocaleString('en-IN') || 0}
          </div>
          <span className="text-[10px] text-stone-500">
            {customer.balance > 0 ? 'Receivable from Customer (Debit)' : 'All accounts settled'}
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#EADBC8] pb-1">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-[#03353A] text-white shadow-xs'
              : 'text-[#837561] hover:bg-[#FFF8EC]'
          }`}
        >
          Customer Ledger (Statements)
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rates'
              ? 'bg-[#03353A] text-white shadow-xs'
              : 'text-[#837561] hover:bg-[#FFF8EC]'
          }`}
        >
          Product Rate Memory ({rateHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#03353A] text-white shadow-xs'
              : 'text-[#837561] hover:bg-[#FFF8EC]'
          }`}
        >
          Recent Orders ({orders.length})
        </button>
      </div>

      {/* TAB 1: LEDGER */}
      {activeTab === 'ledger' && (
        <div className="card-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-['Epilogue'] text-[#2B1B12] uppercase tracking-wider">
              Chronological Transaction Ledger
            </h3>
            <button
              onClick={() => window.print()}
              className="text-xs font-semibold text-[#D9580B] hover:underline"
            >
              Print Statement
            </button>
          </div>

          {ledger.length === 0 ? (
            <p className="text-xs text-[#837561] italic py-8 text-center">No transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] tracking-wider">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Voucher / Ref</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Debit (₹)</th>
                    <th className="pb-2 text-right">Credit (₹)</th>
                    <th className="pb-2 text-right">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {ledger.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FFF8EC]/40">
                      <td className="py-2.5 whitespace-nowrap text-[#837561]">
                        {new Date(row.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-2.5 font-bold font-mono text-[#2B1B12]">
                        {row.refNo}
                      </td>
                      <td className="py-2.5 text-[#514534]">{row.description}</td>
                      <td className="py-2.5 text-right font-medium text-stone-900 table-nums">
                        {row.debit > 0 ? `₹${row.debit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-emerald-700 table-nums">
                        {row.credit > 0 ? `₹${row.credit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-2.5 text-right font-bold table-nums text-[#7A1F2B]">
                        ₹{row.balance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RATE MEMORY */}
      {activeTab === 'rates' && (
        <div className="card-surface p-5 space-y-4">
          <h3 className="text-sm font-bold font-['Epilogue'] text-[#2B1B12] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#D9580B]" />
            <span>Customer-Wise Last Agreed Selling Rates</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {rateHistory.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-[#EADBC8] bg-white space-y-1">
                <p className="text-xs font-bold text-[#2B1B12]">{item.itemId?.name}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-[#837561]">Agreed Rate:</span>
                  <span className="text-sm font-bold text-[#D9580B] table-nums">₹{item.rate}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-stone-400">
                  <span>Standard MRP: ₹{item.itemId?.mrp}</span>
                  <span>{new Date(item.date).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RECENT ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.map(order => (
            <div
              key={order._id}
              onClick={() => navigate(`/orders/${order._id}`)}
              className="card-surface p-4 hover:border-[#D9580B] cursor-pointer flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#2B1B12]">{order.orderNo}</span>
                  <StatusBadge status={order.status} />
                </div>
                <span className="text-xs text-[#837561]">
                  {new Date(order.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-[#2B1B12] table-nums">
                  ₹{order.grandTotal.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-[#837561] capitalize">{order.paymentStatus}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
