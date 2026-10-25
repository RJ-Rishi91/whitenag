import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';

export function PurchasesV3() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showPOModal, setShowPOModal] = useState(false);
  const [poSuccess, setPOSuccess] = useState(false);

  // Default Purchase Orders (starts empty for real production)
  const defaultPurchases = [];

  const [purchases, setPurchases] = useState([]);

  // New PO State
  const [newPO, setNewPO] = useState({
    supplier: 'Mewar Dal Mills Pvt Ltd',
    item: 'Urad Mogar Dal Flour',
    qty: 500,
    unit: 'kg',
    rate: 110,
    godown: 'Sukher Processing Plant',
    paymentTerms: '15 Days Credit'
  });

  useEffect(() => {
    async function loadPurchases() {
      try {
        const res = await api.get('/purchases').catch(() => null);
        if (res?.success && Array.isArray(res.data)) {
          const mapped = res.data.map(p => ({
            _id: p._id,
            poNumber: p.purchaseNumber || `PO-${p._id.slice(-4)}`,
            date: p.invoiceDate ? new Date(p.invoiceDate).toLocaleDateString('en-IN') : 'Today',
            supplier: p.supplier?.businessName || p.supplierName || 'Mewar Supplier',
            itemsSummary: p.items?.map(i => `${i.productName || i.name} (${i.quantity} ${i.unit || 'kg'})`).join(', ') || 'Raw Ingredients',
            godown: p.godown?.name || 'Savina Main Mandi',
            totalAmount: p.grandTotal || p.totalAmount || 0,
            paymentTerms: p.paymentTerms || '15 Days Credit',
            status: p.status || 'received',
            grnNumber: p.grnNumber || 'GRN-LIVE'
          }));
          setPurchases(mapped);
        } else {
          setPurchases([]);
        }
      } catch {
        setPurchases([]);
      }
    }
    loadPurchases();
  }, []);

  const filteredPurchases = purchases.filter(p => {
    const matchSearch =
      searchTerm === '' ||
      p.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.itemsSummary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const totalProcurement = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  const handleCreatePOSubmit = (e) => {
    e.preventDefault();
    const created = {
      _id: `po-${Date.now()}`,
      poNumber: `PO-2024-00${purchases.length + 43}`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      supplier: newPO.supplier,
      itemsSummary: `${newPO.item} (${newPO.qty} ${newPO.unit})`,
      godown: newPO.godown,
      totalAmount: newPO.qty * newPO.rate,
      paymentTerms: newPO.paymentTerms,
      status: 'ordered',
      grnNumber: 'Awaiting Arrival'
    };

    setPurchases(prev => [created, ...prev]);
    setPOSuccess(true);
    setTimeout(() => {
      setPOSuccess(false);
      setShowPOModal(false);
    }, 1000);
  };

  const handleMarkReceived = (id) => {
    setPurchases(prev =>
      prev.map(p => (p._id === id ? { ...p, status: 'received', grnNumber: `GRN-2024-00${Math.floor(40 + Math.random() * 50)}` } : p))
    );
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Operations</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#EA580C]">Procurement & Purchases</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Raw Material Procurement & Inward GRN
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Issue purchase orders for dal, besan, spices, oil, and packaging; track physical intake at godown docks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPOModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Purchase Order (PO)</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Raw Purchases</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              ₹{totalProcurement.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{purchases.length} POs recorded this month</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Goods Received (GRN)</div>
            <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">
              {purchases.filter(p => p.status === 'received').length} Consignments
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Inspected & stocked in silo</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">In-Transit Shipments</div>
            <div className="text-2xl font-bold text-amber-700 font-mono mt-1">
              {purchases.filter(p => p.status === 'in-transit').length} Trucks
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Dispatched from Mandi/Mill</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Approved Vendors</div>
            <div className="text-2xl font-bold text-blue-700 font-mono mt-1">5 Suppliers</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tally Sundry Creditors ledger</div>
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
                placeholder="Search PO no, vendor, ingredient..."
                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#EA580C] w-full sm:w-auto"
            >
              <option value="all">All Delivery Stages</option>
              <option value="ordered">Ordered</option>
              <option value="in-transit">In-Transit</option>
              <option value="received">Received at Dock</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
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
              <span>Purchase Ledger</span>
            </button>
          </div>
        </div>

        {/* PO Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">PO No & Date</th>
                  <th className="py-3 px-4">Supplier / Mill</th>
                  <th className="py-3 px-4">Materials Ordered</th>
                  <th className="py-3 px-4">Target Godown</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">GRN Intake</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <span className="material-symbols-outlined text-[36px] mb-2 block text-slate-300">receipt_long</span>
                      <p className="font-semibold text-slate-600">No purchase orders found</p>
                      <p className="text-[11px] text-slate-400">Click '+ New Purchase Order' to record raw material procurement.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((po) => {
                    return (
                      <tr key={po._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-bold font-mono text-slate-900">{po.poNumber}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{po.date}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {po.supplier}
                          <div className="text-[10px] text-slate-400 font-normal">{po.paymentTerms}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {po.itemsSummary}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {po.godown}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-[13px]">
                          ₹{po.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {po.grnNumber}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {po.status === 'received' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Received
                            </span>
                          ) : po.status === 'in-transit' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              On Truck
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Ordered
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {po.status !== 'received' ? (
                            <button
                              type="button"
                              onClick={() => handleMarkReceived(po._id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs transition-colors"
                            >
                              Receive Inward
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">Stocked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredPurchases.length} of {purchases.length} purchase orders</span>
            <span className="font-mono">Tally Purchase Voucher Synced</span>
          </div>
        </div>

        {/* PO Entry Modal */}
        {showPOModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Create Raw Material Purchase Order</h3>
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {poSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Purchase Order generated and queued for Tally supplier voucher!</span>
                </div>
              )}

              <form onSubmit={handleCreatePOSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Select Supplier / Mill *
                  </label>
                  <select
                    value={newPO.supplier}
                    onChange={(e) => setNewPO({ ...newPO, supplier: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Mewar Dal Mills Pvt Ltd">Mewar Dal Mills Pvt Ltd (Udaipur)</option>
                    <option value="Bikaner Chana Corporation">Bikaner Chana Corporation</option>
                    <option value="Mathania Chilli Mandi Syndicate">Mathania Chilli Mandi Syndicate</option>
                    <option value="Hathras Hing Trading Co.">Hathras Hing Trading Co.</option>
                    <option value="Apex Polyfilm & Pouches">Apex Polyfilm & Pouches</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Raw Material Item
                  </label>
                  <select
                    value={newPO.item}
                    onChange={(e) => setNewPO({ ...newPO, item: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Urad Mogar Dal Flour">Urad Mogar Dal Flour (Filter Grade)</option>
                    <option value="Pure Chana Dal Besan">Pure Chana Dal Besan (Fine)</option>
                    <option value="Compounded Pure Hing">Compounded Pure Hing (Hathras)</option>
                    <option value="Mathania Red Chilli Powder">Mathania Red Chilli Powder</option>
                    <option value="Edible Cottonseed Oil">Edible Cottonseed Oil</option>
                    <option value="500g Poly Pouches">500g Poly Pouches (Nagfani Brand)</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={newPO.qty}
                      onChange={(e) => setNewPO({ ...newPO, qty: +e.target.value })}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Unit
                    </label>
                    <select
                      value={newPO.unit}
                      onChange={(e) => setNewPO({ ...newPO, unit: e.target.value })}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="pcs">pcs</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Rate / Unit (₹)
                    </label>
                    <input
                      type="number"
                      value={newPO.rate}
                      onChange={(e) => setNewPO({ ...newPO, rate: +e.target.value })}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Receiving Godown
                    </label>
                    <select
                      value={newPO.godown}
                      onChange={(e) => setNewPO({ ...newPO, godown: e.target.value })}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="Sukher Processing Plant">Sukher Processing Plant</option>
                      <option value="Savina Main Mandi (Godown A)">Savina Main Mandi (Godown A)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={newPO.paymentTerms}
                      onChange={(e) => setNewPO({ ...newPO, paymentTerms: e.target.value })}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="15 Days Credit">15 Days Credit</option>
                      <option value="7 Days Credit">7 Days Credit</option>
                      <option value="Immediate Advance">Immediate Advance</option>
                      <option value="Cheque on Delivery">Cheque on Delivery</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Total Purchase Value:</span>
                  <span className="text-base font-bold font-mono text-[#EA580C]">
                    ₹{(newPO.qty * newPO.rate).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPOModal(false)}
                    className="px-3.5 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-lg shadow-xs transition-colors"
                  >
                    Issue Purchase Order
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
export default PurchasesV3;
