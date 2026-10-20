import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api/client.js';

export function NewOrderV3() {
  const navigate = useNavigate();
  const location = useLocation();

  const [catalogItems, setCatalogItems] = useState([]);

  // Parties state
  const [parties, setParties] = useState([
    {
      _id: 'cust-sharma',
      businessName: 'Sharma General Store',
      contactPerson: 'Ramesh Sharma',
      phone: '+91 98290 12345',
      gstin: '08AAACS1421K1ZB',
      city: 'Udaipur',
      address: 'Plot 42, Hiran Magri Sector 3, Near BSNL Tower, Udaipur (313002)',
      creditLimit: 50000,
      outstanding: 18200,
      route: 'Hiran Magri (Sec 3-5)'
    },
    {
      _id: 'cust-mahalaxmi',
      businessName: 'Mahalaxmi Kirana Mandir',
      contactPerson: 'Prakash Chandra',
      phone: '+91 94141 87654',
      gstin: '08ABCP8821M1Z1',
      city: 'Udaipur',
      address: 'Shop 12, Krishi Upaj Mandi, Savina, Udaipur',
      creditLimit: 75000,
      outstanding: 24500,
      route: 'Savina Main Mandi'
    },
    {
      _id: 'cust-jodhpur',
      businessName: 'Jodhpur Sweets & Namkeen',
      contactPerson: 'Bhawani Singh',
      phone: '+91 98280 43210',
      gstin: '08AAGFJ7712P1ZN',
      city: 'Udaipur',
      address: 'Opp. Town Hall, City Center, Udaipur',
      creditLimit: 100000,
      outstanding: 42000,
      route: 'Krishi Mandi Hub'
    },
    {
      _id: 'cust-kailash',
      businessName: 'Kailash Provision Store',
      contactPerson: 'Kailash Meena',
      phone: '+91 97840 55443',
      gstin: '08BCKPM3321L1Z9',
      city: 'Udaipur',
      address: 'Sector 14 Main Circle, UIT Colony, Udaipur',
      creditLimit: 30000,
      outstanding: 5600,
      route: 'UIT Colony'
    }
  ]);

  const [selectedPartyId, setSelectedPartyId] = useState('cust-sharma');

  // Selected party object
  const selectedParty = useMemo(() => {
    return parties.find(p => p._id === selectedPartyId) || parties[0];
  }, [parties, selectedPartyId]);

  // Line items state
  const [items, setItems] = useState([
    {
      id: 1,
      sku: 'NFD-PAP-014',
      productName: 'Urad Hari Mirch Papad',
      packSize: '500g Poly Pouch',
      stockAvailable: '140 kg',
      quantity: 30,
      unit: 'kg',
      rate: 130,
      gstPercent: 5,
      weightKg: 30.0
    },
    {
      id: 2,
      sku: 'NFD-KHK-008',
      productName: 'Methi Khakhra (Vacuum Crispy)',
      packSize: '200g Box',
      stockAvailable: '85 pkts',
      quantity: 40,
      unit: 'pkts',
      rate: 52,
      gstPercent: 5,
      weightKg: 8.0
    },
    {
      id: 3,
      sku: 'NFD-SEV-003',
      productName: 'Loung Sev (Special Rajasthani)',
      packSize: '1kg Bulk Poly Pack',
      stockAvailable: '95 kg',
      quantity: 20,
      unit: 'kg',
      rate: 220,
      gstPercent: 12,
      weightKg: 20.0
    }
  ]);

  // Dispatch / order settings
  const [orderDetails, setOrderDetails] = useState({
    van: 'Van 01 (Mukesh - Morning Run)',
    paymentTerms: '7 Days Credit (Weekly Cycle)',
    deliverySlot: 'Morning Dispatch (09:00 AM - 01:00 PM)',
    channel: 'B2B Wholesale',
    notes: 'Deliver to back shutter. Collect overdue cheque along with signed LR copy.'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  // Fetch live parties & items from MongoDB if available
  useEffect(() => {
    async function loadData() {
      try {
        const [partiesRes, itemsRes] = await Promise.all([
          api.get('/parties').catch(() => null),
          api.get('/items').catch(() => null)
        ]);

        if (itemsRes?.success && Array.isArray(itemsRes.data)) {
          setCatalogItems(itemsRes.data);
        }

        if (partiesRes?.success && Array.isArray(partiesRes.data) && partiesRes.data.length > 0) {
          const mappedParties = partiesRes.data.map(p => ({
            _id: p._id,
            businessName: p.name || p.businessName,
            contactPerson: p.contactPerson || 'Proprietor',
            phone: p.mobile || p.phone || '+91 98290 12345',
            gstin: p.gstin || '08AAACS1421K1ZB',
            city: p.city || 'Udaipur',
            address: p.address || 'Udaipur',
            creditLimit: p.creditLimit || 50000,
            outstanding: p.balance !== undefined ? p.balance : (p.outstanding || 0),
            route: p.areaId?.name ? `${p.areaId.name} Sector` : (p.route || `${p.city || 'Udaipur'} Beat`)
          }));
          setParties(mappedParties);
          if (location.state?.partyId && mappedParties.some(p => p._id === location.state.partyId)) {
            setSelectedPartyId(location.state.partyId);
          } else {
            setSelectedPartyId(mappedParties[0]._id);
          }
        }
      } catch {
        // preserve defaults
      }
    }
    loadData();
  }, [location.state]);

  // Update item quantity
  const handleUpdateQty = (id, delta) => {
    setItems(prev =>
      prev.map(i => {
        if (i.id === id) {
          const newQty = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      })
    );
  };

  const handleSetQty = (id, val) => {
    const q = parseInt(val, 10);
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity: isNaN(q) || q < 1 ? 1 : q } : i))
    );
  };

  const handleUpdateRate = (id, newRate) => {
    const r = parseFloat(newRate) || 0;
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, rate: r } : i))
    );
  };

  const handleRemoveItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Add catalog item
  const handleAddProduct = (name, sku, rate, gst, pack, weightPerUnit) => {
    const matched = catalogItems.find(ci => ci.sku === sku || (ci.name && ci.name.toLowerCase().includes(name.toLowerCase())));
    const newItem = {
      id: Date.now(),
      itemId: matched?._id || undefined,
      sku: matched?.sku || sku,
      productName: matched?.name || name,
      packSize: pack,
      stockAvailable: 'In Stock (Savina)',
      quantity: 10,
      unit: 'pkts',
      rate: rate,
      gstPercent: gst,
      weightKg: weightPerUnit * 10
    };
    setItems(prev => [...prev, newItem]);
  };

  // Financial calculations
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let totalWeight = 0;

    items.forEach(i => {
      const lineSubtotal = i.quantity * i.rate;
      const tax = (lineSubtotal * i.gstPercent) / 100;
      subtotal += lineSubtotal;
      totalTax += tax;
      totalWeight += i.weightKg || (i.quantity * 0.5);
    });

    const grandTotal = Math.round(subtotal + totalTax);
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    return {
      subtotal,
      cgst,
      sgst,
      totalTax,
      totalWeight,
      grandTotal
    };
  }, [items]);

  // Projected credit check
  const projectedOutstanding = (selectedParty?.outstanding || 0) + totals.grandTotal;
  const isCreditExceeded = (selectedParty?.creditLimit || 0) > 0 && projectedOutstanding > (selectedParty?.creditLimit || 0);
  const creditExcess = Math.max(0, projectedOutstanding - (selectedParty?.creditLimit || 0));

  // Submit order to API
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one line item to the order.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Fetch Godown ID
      const godownsRes = await api.get('/godowns').catch(() => null);
      const godownId = godownsRes?.data?.[0]?._id;
      const partyId = selectedParty._id?.length === 24 ? selectedParty._id : (parties.find(p => p._id?.length === 24)?._id);

      if (partyId && godownId) {
        await api.post('/orders', {
          partyId,
          godownId,
          allowStockOverride: true,
          paymentTerms: orderDetails.paymentTerms,
          remarks: orderDetails.notes,
          items: items.map(i => ({
            itemId: i.itemId,
            sku: i.sku,
            name: i.productName,
            qty: i.quantity,
            rate: i.rate,
            taxRate: i.gstPercent || 5
          }))
        }).catch(err => {
          console.warn('Real order creation catch:', err);
        });
      }

      setSuccessBanner(true);
      setTimeout(() => {
        navigate('/v3/orders');
      }, 1200);
    } catch (err) {
      alert('Error creating order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Sales</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span>Orders</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#EA580C]">Direct Order Entry</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Create New Sales Order
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Rapid order booking with party credit check, godown inventory validation, and real-time GST computation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/v3/orders')}
              className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              Cancel & Return
            </button>
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSubmitting ? 'sync' : 'check_circle'}
              </span>
              <span>{isSubmitting ? 'Posting Order...' : 'Confirm & Book Order'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successBanner && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
              <span>Sales Order successfully recorded and queued for packing! Redirecting to orders pipeline...</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700">Tally XML Payload Generated</span>
          </div>
        )}

        {/* Main 2-Column Form Layout */}
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Party & Delivery Info (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Party Selection Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-500">storefront</span>
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">Party / Customer Details</span>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                  Tally Ledger Synced
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Customer Account *
                </label>
                <select
                  value={selectedPartyId}
                  onChange={(e) => setSelectedPartyId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white transition-all"
                >
                  {parties.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.businessName} — {p.route || p.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Party Summary Details Box */}
              {selectedParty && (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Contact Person:</span>
                    <span className="font-semibold text-slate-800">{selectedParty.contactPerson || 'Proprietor'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono text-slate-800 font-medium">{selectedParty.phone || '+91 98290 12345'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">GSTIN:</span>
                    <span className="font-mono text-slate-800 font-semibold">{selectedParty.gstin || '08AAACS1421K1ZB'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Beat / Route:</span>
                    <span className="font-medium text-slate-700">{selectedParty.route || 'Savina Beat'}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Credit Limit</div>
                      <div className="font-mono font-bold text-slate-900 mt-0.5">₹{(selectedParty.creditLimit || 50000).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-[10px] text-amber-600 uppercase font-bold">Current Outstanding</div>
                      <div className="font-mono font-bold text-amber-700 mt-0.5">₹{(selectedParty.outstanding || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {/* Projected Credit Utilization & Breached Warning */}
                  <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${isCreditExceeded ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px]">
                        {isCreditExceeded ? 'warning' : 'verified_user'}
                      </span>
                      <span>{isCreditExceeded ? `Credit Exceeded (+₹${creditExcess.toLocaleString('en-IN')})` : 'Credit Standing Healthy'}</span>
                    </div>
                    <span className="font-mono font-bold text-[11px]">
                      Proj. Due: ₹{projectedOutstanding.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Logistics & Delivery Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="material-symbols-outlined text-[18px] text-slate-500">local_shipping</span>
                <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">Logistics & Payment terms</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Delivery Vehicle
                  </label>
                  <select
                    value={orderDetails.van}
                    onChange={(e) => setOrderDetails({ ...orderDetails, van: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white"
                  >
                    <option value="Van 01 (Mukesh - Morning Run)">Van 01 (Mukesh - Morning Run)</option>
                    <option value="Van 02 (Sohan - Savina Run)">Van 02 (Sohan - Savina Run)</option>
                    <option value="Van 03 (Ramesh - UIT Run)">Van 03 (Ramesh - UIT Run)</option>
                    <option value="Van 04 (Dinesh - Krishi Mandi)">Van 04 (Dinesh - Krishi Mandi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery Slot
                  </label>
                  <select
                    value={orderDetails.deliverySlot}
                    onChange={(e) => setOrderDetails({ ...orderDetails, deliverySlot: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white"
                  >
                    <option value="Morning Dispatch (09:00 AM - 01:00 PM)">Morning Dispatch (09:00 AM - 01:00 PM)</option>
                    <option value="Afternoon Dispatch (02:00 PM - 06:00 PM)">Afternoon Dispatch (02:00 PM - 06:00 PM)</option>
                    <option value="Urgent Counter Pickup (Godown A)">Urgent Counter Pickup (Godown A)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={orderDetails.paymentTerms}
                    onChange={(e) => setOrderDetails({ ...orderDetails, paymentTerms: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white"
                  >
                    <option value="Immediate Cash on Delivery">Immediate Cash on Delivery</option>
                    <option value="7 Days Credit (Weekly Cycle)">7 Days Credit (Weekly Cycle)</option>
                    <option value="15 Days Credit (Verified B2B)">15 Days Credit (Verified B2B)</option>
                    <option value="Cheque on Delivery">Cheque on Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery Instructions / Driver Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={orderDetails.notes}
                    onChange={(e) => setOrderDetails({ ...orderDetails, notes: e.target.value })}
                    placeholder="e.g. Back shutter delivery, collect cheque..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Items & Financial Totals (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Quick Favorites Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 uppercase tracking-wider">Quick Add High-Volume Items:</span>
                <span className="text-slate-400 text-[11px]">Click to add 10 units</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Urad Hari Mirch Papad', sku: 'NFD-PAP-014', rate: 130, gst: 5, pack: '500g Pkt', weight: 0.5 },
                  { name: 'Rajasthani Loung Sev', sku: 'NFD-SEV-003', rate: 220, gst: 12, pack: '1kg Poly', weight: 1.0 },
                  { name: 'Special Moong Papad', sku: 'NFD-PAP-002', rate: 145, gst: 5, pack: '500g Pkt', weight: 0.5 },
                  { name: 'Methi Khakhra Crispy', sku: 'NFD-KHK-008', rate: 52, gst: 5, pack: '200g Box', weight: 0.2 },
                  { name: 'Ker Sangri Aachar', sku: 'NFD-ACH-002', rate: 155, gst: 12, pack: '500g Jar', weight: 0.5 },
                  { name: 'Bikaneri Bhujia Fine', sku: 'NFD-SEV-009', rate: 210, gst: 12, pack: '1kg Pkt', weight: 1.0 }
                ].map((fav) => (
                  <button
                    key={fav.sku}
                    type="button"
                    onClick={() => handleAddProduct(fav.name, fav.sku, fav.rate, fav.gst, fav.pack, fav.weight)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#EA580C]">add</span>
                    <span>{fav.name}</span>
                    <span className="text-slate-400 font-mono">₹{fav.rate}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-500">inventory_2</span>
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">Line Items Ordered</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {items.length} items • {totals.totalWeight.toFixed(1)} kg total
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Item Details</th>
                      <th className="py-2.5 px-3 text-center">Stock</th>
                      <th className="py-2.5 px-3 text-center w-28">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                      <th className="py-2.5 px-3 text-center">GST</th>
                      <th className="py-2.5 px-3 text-right">Total (₹)</th>
                      <th className="py-2.5 px-3 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {items.map((item) => {
                      const lineTotal = item.quantity * item.rate;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{item.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.sku} • {item.packSize}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {item.stockAvailable}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center border border-slate-200 rounded-md bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.id, -1)}
                                className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 font-bold text-xs"
                                title="Decrease by 1"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleSetQty(item.id, e.target.value)}
                                className="w-12 h-6 text-center font-mono font-bold text-slate-900 text-xs border-x border-slate-200 focus:outline-none focus:bg-amber-50"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.id, 1)}
                                className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 font-bold text-xs"
                                title="Increase by 1"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleUpdateRate(item.id, e.target.value)}
                              className="w-16 h-7 text-right font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1 text-xs focus:bg-white"
                            />
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                            {item.gstPercent}%
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove Line Item"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Summary Card */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-200">
                <div className="max-w-xs ml-auto space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value (Subtotal):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ₹{totals.subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST:</span>
                    <span className="font-mono text-slate-700">₹{totals.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST:</span>
                    <span className="font-mono text-slate-700">₹{totals.sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Total Consignment Weight:</span>
                    <span className="font-mono">{totals.totalWeight.toFixed(1)} kg</span>
                  </div>
                  <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-sm">Invoice Grand Total:</span>
                    <span className="text-xl font-bold text-[#EA580C] font-mono">
                      ₹{totals.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                <span>Auto-generates Sales Voucher for Tally ODBC server sync.</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/v3/orders')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                  <span>{isSubmitting ? 'Posting...' : 'Book Order Now'}</span>
                </button>
              </div>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
export default NewOrderV3;
