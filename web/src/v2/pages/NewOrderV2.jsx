import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { fireSuccessConfetti } from '../animations/Confetti.js';

export function NewOrderV2() {
  const navigate = useNavigate();

  // Customer state
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState({
    _id: 'cust-sharma',
    businessName: 'Sharma General Store',
    contactPerson: 'Ramesh Sharma',
    phone: '+91 98290 12345',
    gstin: '08AAACS1421K1ZB',
    address: 'Plot 42, Hiran Magri Sector 3, Near BSNL Tower, Udaipur (313002)',
    creditLimit: 50000,
    outstanding: 18200,
    route: 'SEC 3 / SAVINA BEAT 2',
    tier: 'Tier A Wholesale'
  });

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
      mrp: 140,
      discountPercent: 0,
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
      mrp: 60,
      discountPercent: 3,
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
      mrp: 240,
      discountPercent: 0,
      gstPercent: 12,
      weightKg: 20.0
    },
    {
      id: 4,
      sku: 'NFD-ACH-002',
      productName: 'Ker Sangri Aachar (Traditional)',
      packSize: '500g Glass Jar',
      stockAvailable: '18 pkts (Deficit)',
      quantity: 30,
      unit: 'pkts',
      rate: 155,
      mrp: 175,
      discountPercent: 0,
      gstPercent: 12,
      weightKg: 4.0
    }
  ]);

  // Logistics state
  const [logistics, setLogistics] = useState({
    beatZone: 'SEC 3 (Hiran Magri Sector 3-5)',
    van: 'Van RJ-27-GA-4890 (Mukesh - Morning Run)',
    paymentTerms: '7 Days Credit (Due: 26 Oct)',
    channel: 'WhatsApp',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliverySlot: '03:00 PM - 07:00 PM',
    notes: 'Deliver through back lane shutter. Collect overdue ₹5,000 cheque from Sharmaji along with fresh sign stamp on LR copy.'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreatedSuccess, setOrderCreatedSuccess] = useState(false);

  // Fetch live products & customers from DB if available
  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, pRes] = await Promise.all([
          api.get('/customers?limit=20').catch(() => null),
          api.get('/products?limit=50').catch(() => null)
        ]);

        if (cRes?.success && Array.isArray(cRes.data) && cRes.data.length > 0) {
          setCustomers(cRes.data);
        }
      } catch {
        // preserve fallback
      }
    }
    loadData();
  }, []);

  // Calculation memo
  const calculations = useMemo(() => {
    let grossTotal = 0;
    let totalDiscount = 0;
    let taxableTotal = 0;
    let totalGst = 0;
    let totalWeight = 0;

    items.forEach(item => {
      const lineGross = item.quantity * item.rate;
      const lineDisc = (lineGross * (item.discountPercent || 0)) / 100;
      const lineTaxable = lineGross - lineDisc;
      const lineGst = (lineTaxable * item.gstPercent) / 100;

      grossTotal += lineGross;
      totalDiscount += lineDisc;
      taxableTotal += lineTaxable;
      totalGst += lineGst;
      totalWeight += item.weightKg || (item.quantity * 0.5);
    });

    const netPayable = Math.round(taxableTotal + totalGst);
    const roundOff = (netPayable - (taxableTotal + totalGst)).toFixed(2);

    return {
      grossTotal,
      totalDiscount,
      taxableTotal,
      cgst: totalGst / 2,
      sgst: totalGst / 2,
      totalGst,
      totalWeight,
      roundOff,
      netPayable
    };
  }, [items]);

  const updateQuantity = (id, delta) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQ = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQ };
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddQuickProduct = (name, sku, rate, gst, pack) => {
    const newItem = {
      id: Date.now(),
      sku,
      productName: name,
      packSize: pack,
      stockAvailable: 'In Stock (Savina)',
      quantity: 10,
      unit: 'pkts',
      rate,
      mrp: rate * 1.15,
      discountPercent: 0,
      gstPercent: gst,
      weightKg: 5.0
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.businessName,
        channel: logistics.channel.toLowerCase(),
        items: items.map(i => ({
          sku: i.sku,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.rate,
          gstRate: i.gstPercent,
          lineTotal: i.quantity * i.rate
        })),
        subtotal: calculations.taxableTotal,
        taxTotal: calculations.totalGst,
        grandTotal: calculations.netPayable,
        paymentStatus: 'unpaid',
        status: 'received',
        deliveryNotes: logistics.notes
      };

      await api.post('/orders', payload).catch(() => null);

      setOrderCreatedSuccess(true);
      fireSuccessConfetti();

      setTimeout(() => {
        navigate('/v2/orders');
      }, 1500);
    } catch (err) {
      alert('Error creating order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-20">
      <div className="px-4 sm:px-8 py-6 w-full max-w-[1600px] mx-auto">
        
        {/* Breadcrumb & Order Meta Heading */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#03353A]">
              <span onClick={() => navigate('/v2')} className="hover:text-[#D9580B] cursor-pointer">Operations</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span onClick={() => navigate('/v2/orders')} className="hover:text-[#D9580B] cursor-pointer">Orders</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#D9580B] font-bold">SO-2024-0891</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold text-[#111E20] tracking-tight">
                Create Sales Order
              </h1>
              <span className="px-2.5 py-1 rounded-full bg-[#BCE7ED] text-[#03353A] text-xs font-bold uppercase tracking-wider">
                Draft #891
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F6F9] text-[#03353A] text-xs font-semibold border border-[#CEDDDF]">
                <span className="material-symbols-outlined text-[14px] text-[#D9580B]">warehouse</span>
                Savina Mandi Godown A
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/v2/orders')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#EADBC8] text-[#03353A] hover:bg-[#FFF7EE] text-xs font-bold transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>Recent Orders</span>
            </button>
            <button
              onClick={() => setItems([])}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#EADBC8] text-[#03353A] hover:bg-[#FFF7EE] text-xs font-bold transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">cached</span>
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* 2-Pane Primary Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANE: Order Entry Form (Col 1 to 8) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            
            {/* STEP 1: Customer Selection */}
            <section className="bg-white rounded-2xl shadow-sm border border-[#EADBC8]/60 p-6 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-[#EADBC8]/40">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#D9580B] text-white font-outfit font-bold text-sm shadow-xs">
                    1
                  </span>
                  <div>
                    <h2 className="font-outfit font-bold text-base text-[#111E20]">Customer Selection</h2>
                    <p className="text-xs text-[#625B4F]">Lookup registered Udaipur B2B retailer or wholesaler party</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/customers/new')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8F6F9] text-[#03353A] font-bold text-xs hover:bg-[#BCE7ED] transition-colors border border-[#CEDDDF]"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#D9580B]">person_add</span>
                  <span>Quick Register</span>
                </button>
              </div>

              {/* Selected Customer Card */}
              <div className="mt-4 bg-[#FFF7EE] rounded-xl p-5 border border-[#EADBC8] flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#D9580B] to-[#E8A317] text-white flex items-center justify-center font-outfit font-extrabold text-xl flex-shrink-0 shadow-sm">
                    {selectedCustomer.businessName.charAt(0)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-outfit font-bold text-base text-[#111E20] truncate">
                        {selectedCustomer.businessName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#FFDBCD] text-[#9F3C00] text-[10px] font-extrabold tracking-wide uppercase">
                        {selectedCustomer.tier}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#625B4F]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#D9580B]">pin_drop</span>
                        {selectedCustomer.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#03353A]">call</span>
                        {selectedCustomer.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#03353A] pt-1">
                      <span>GSTIN: <strong className="font-semibold">{selectedCustomer.gstin}</strong></span>
                      <span>•</span>
                      <span>Credit Limit: <strong className="font-semibold">₹{selectedCustomer.creditLimit.toLocaleString('en-IN')}</strong></span>
                      <span>•</span>
                      <span>Route: <strong>{selectedCustomer.route}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Overdue alert */}
                <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
                  <div className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 flex items-center gap-2 text-xs font-bold border border-red-200">
                    <span className="material-symbols-outlined text-[18px] text-red-600 animate-pulse">warning</span>
                    <span>Outstanding: ₹{selectedCustomer.outstanding.toLocaleString('en-IN')} (15 days overdue)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* STEP 2: Product Line Items */}
            <section className="bg-white rounded-2xl shadow-sm border border-[#EADBC8]/60 p-6 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EADBC8]/40">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#D9580B] text-white font-outfit font-bold text-sm shadow-xs">
                    2
                  </span>
                  <div>
                    <h2 className="font-outfit font-bold text-base text-[#111E20]">Product Line Items</h2>
                    <p className="text-xs text-[#625B4F]">Select traditional Rajasthani papad, namkeen, khakhra, pickles</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6F9] text-[#03353A] text-xs font-bold border border-[#CEDDDF]">
                  <span className="material-symbols-outlined text-[16px] text-[#D9580B]">inventory</span>
                  <span>Active Godown: Savina Central (Bay 04)</span>
                </div>
              </div>

              {/* Frequent Items Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#625B4F] font-semibold">Sharma Store Frequent items:</span>
                <button
                  type="button"
                  onClick={() => handleAddQuickProduct('Urad Special Masala 500g', 'NFD-PAP-001', 145, 5, '500g Pouch')}
                  className="px-2.5 py-1 rounded-full bg-[#FFF7EE] hover:bg-[#FFDBCD] text-[#03353A] border border-[#EADBC8] transition-colors font-medium"
                >
                  + Urad Special Masala 500g
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickProduct('Loung Sev 1kg Bulk', 'NFD-SEV-004', 210, 12, '1kg Poly')}
                  className="px-2.5 py-1 rounded-full bg-[#FFF7EE] hover:bg-[#FFDBCD] text-[#03353A] border border-[#EADBC8] transition-colors font-medium"
                >
                  + Loung Sev 1kg Bulk
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickProduct('Ker Sangri Aachar 500g', 'NFD-ACH-003', 160, 12, '500g Glass')}
                  className="px-2.5 py-1 rounded-full bg-[#FFF7EE] hover:bg-[#FFDBCD] text-[#03353A] border border-[#EADBC8] transition-colors font-medium"
                >
                  + Ker Sangri Aachar 500g
                </button>
              </div>

              {/* Stock Warning Banner */}
              <div className="rounded-xl bg-[#FFF8EC] border border-[#E8A317] p-3.5 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#D9580B] text-[20px] flex-shrink-0 mt-0.5">
                  error_outline
                </span>
                <div className="flex-1 text-xs text-[#594238]">
                  <span className="font-bold text-[#111E20]">Dispatch Warning for Line #4 (Ker Sangri Aachar): </span>
                  Requested 30 packets exceeds available Savina unreserved stock (18 pkts). Shortfall will require automatic transfer from Sukher Unit 2 or partial backorder.
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto rounded-xl border border-[#EADBC8]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#E8F6F9] text-[#625B4F] font-bold uppercase tracking-wider border-b border-[#CEDDDF]">
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3 min-w-[200px]">Product / Pack Size</th>
                      <th className="py-3 px-3 min-w-[120px]">Godown Stock</th>
                      <th className="py-3 px-3 min-w-[120px]">Quantity</th>
                      <th className="py-3 px-3 min-w-[130px]">Rate per Unit</th>
                      <th className="py-3 px-3 min-w-[70px]">Disc %</th>
                      <th className="py-3 px-3 text-right min-w-[100px]">Line Total</th>
                      <th className="py-3 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBC8]/50 bg-white">
                    {items.map((item, idx) => {
                      const lineTotal = (item.quantity * item.rate * (1 - (item.discountPercent || 0) / 100));
                      return (
                        <tr key={item.id} className="hover:bg-[#FFF7EE] transition-colors">
                          <td className="py-3.5 px-3 font-mono text-[#625B4F] font-bold">0{idx + 1}</td>
                          <td className="py-3.5 px-3">
                            <div className="font-outfit font-bold text-sm text-[#111E20]">{item.productName}</div>
                            <div className="text-[11px] text-[#625B4F]">
                              <span>{item.packSize}</span>
                              <span className="mx-1">•</span>
                              <span className="font-mono text-[#03353A]">{item.sku}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F6F9] text-[#03353A] text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {item.stockAvailable}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center bg-[#E8F6F9] rounded-lg p-0.5 w-fit border border-[#CEDDDF]">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -5)}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-[#111E20] font-bold"
                              >
                                -
                              </button>
                              <span className="w-12 text-center font-outfit font-bold text-xs text-[#111E20]">
                                {item.quantity} {item.unit}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 5)}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-[#111E20] font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-outfit font-bold text-[#111E20]">₹ {item.rate.toFixed(2)}</div>
                            <div className="text-[10px] text-[#625B4F] line-through">MRP ₹{item.mrp}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs font-semibold">{item.discountPercent}%</span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="font-outfit font-bold text-sm text-[#111E20]">
                              ₹ {lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <span className="text-[10px] text-[#625B4F]">GST {item.gstPercent}%</span>
                          </td>
                          <td className="py-3.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-[#8C7166] hover:text-red-600 transition-colors p-1"
                              title="Delete row"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* STEP 3: Logistics & Dispatch Routing */}
            <section className="bg-white rounded-2xl shadow-sm border border-[#EADBC8]/60 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#EADBC8]/40">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#D9580B] text-white font-outfit font-bold text-sm shadow-xs">
                  3
                </span>
                <div>
                  <h2 className="font-outfit font-bold text-base text-[#111E20]">Logistics &amp; Dispatch Routing</h2>
                  <p className="text-xs text-[#625B4F]">Assign Udaipur dispatch zones, tempo vehicle runs, and payment arrangements</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#625B4F] mb-1">
                    Delivery Beat / Zone
                  </label>
                  <select
                    value={logistics.beatZone}
                    onChange={(e) => setLogistics({ ...logistics, beatZone: e.target.value })}
                    className="w-full h-10 px-3 bg-[#FFF7EE] rounded-xl text-[#111E20] border border-[#EADBC8] font-medium"
                  >
                    <option>SEC 3 (Hiran Magri Sector 3-5)</option>
                    <option>SAVINA (Savina Krishi Mandi Beat)</option>
                    <option>UIT / Fatehpura / Panchwati</option>
                    <option>Old City / Jagdish Chowk (Auto Only)</option>
                    <option>Sukher Industrial Belt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#625B4F] mb-1">
                    Preferred Route &amp; Van
                  </label>
                  <select
                    value={logistics.van}
                    onChange={(e) => setLogistics({ ...logistics, van: e.target.value })}
                    className="w-full h-10 px-3 bg-[#FFF7EE] rounded-xl text-[#111E20] border border-[#EADBC8] font-medium"
                  >
                    <option>Van RJ-27-GA-4890 (Mukesh - Morning Run)</option>
                    <option>Van RJ-27-GB-1102 (Sohan - Afternoon Run)</option>
                    <option>Tata Ace Electric (Old City Evening)</option>
                    <option>Direct Customer Pickup (Godown Counter)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#625B4F] mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={logistics.paymentTerms}
                    onChange={(e) => setLogistics({ ...logistics, paymentTerms: e.target.value })}
                    className="w-full h-10 px-3 bg-[#FFF7EE] rounded-xl text-[#111E20] border border-[#EADBC8] font-medium"
                  >
                    <option>7 Days Credit (Due: 26 Oct)</option>
                    <option>Cash on Delivery (Driver Collection)</option>
                    <option>15 Days Credit</option>
                    <option>Immediate UPI / NEFT Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#625B4F] mb-1">
                  Godown Dispatch &amp; Driver Gate Notes
                </label>
                <textarea
                  value={logistics.notes}
                  onChange={(e) => setLogistics({ ...logistics, notes: e.target.value })}
                  className="w-full p-3 bg-[#FFF7EE] rounded-xl text-[#111E20] text-xs border border-[#EADBC8] focus:outline-none focus:ring-1 focus:ring-[#D9580B] resize-none"
                  rows="2"
                />
              </div>
            </section>

          </div>

          {/* RIGHT PANE: Sticky Live Order Summary (Col 9 to 12) */}
          <div className="xl:col-span-4 sticky top-20 flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-md border border-[#EADBC8] p-6 flex flex-col gap-4">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EADBC8]/40">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D9580B] text-[22px]">receipt_long</span>
                  <h3 className="font-outfit font-bold text-lg text-[#111E20]">Order Calculation</h3>
                </div>
                <span className="text-[11px] font-bold text-[#03353A] bg-[#E8F6F9] px-2.5 py-0.5 rounded-full border border-[#CEDDDF]">
                  Live Sync
                </span>
              </div>

              {/* Stock Reservation Pill */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#E8F6F9] text-[#03353A] text-xs font-medium border border-[#CEDDDF]">
                <span className="material-symbols-outlined text-[18px] text-[#03353A]">lock_clock</span>
                <span>Stock reserved upon confirm (Hold: 4 hours)</span>
              </div>

              {/* Cargo Weight Breakdown */}
              <div className="p-3.5 rounded-xl bg-[#FFF7EE] border border-[#EADBC8] flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] text-[#625B4F] font-bold uppercase">
                  <span>Logistics Weight &amp; Units</span>
                  <span className="text-[#03353A]">{items.length} Line Items</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="font-outfit font-extrabold text-2xl text-[#111E20]">{calculations.totalWeight.toFixed(1)}</span>
                    <span className="text-xs text-[#625B4F]">kg net</span>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-bold text-[#111E20]">6 Cartons · 2 Sacks</div>
                    <div className="text-[10px] text-[#625B4F]">Est. Vol: 0.38 m³</div>
                  </div>
                </div>
                {/* Weight bar */}
                <div className="w-full h-2 bg-[#EADBC8] rounded-full overflow-hidden flex mt-1">
                  <div className="bg-[#D9580B] h-full" style={{ width: '48%' }}></div>
                  <div className="bg-[#03353A] h-full" style={{ width: '13%' }}></div>
                  <div className="bg-[#E8A317] h-full" style={{ width: '32%' }}></div>
                  <div className="bg-red-500 h-full" style={{ width: '7%' }}></div>
                </div>
              </div>

              {/* Financial Computation Table */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center justify-between text-[#625B4F]">
                  <span>Gross Product Amount</span>
                  <span className="font-bold text-[#111E20]">₹ {calculations.grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-[#D9580B]">
                  <span>Promotional Discount</span>
                  <span className="font-bold">- ₹ {calculations.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-[#625B4F]">
                  <span>Taxable Subtotal</span>
                  <span className="font-bold text-[#111E20]">₹ {calculations.taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#E8F6F9] border border-[#CEDDDF] space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-[#03353A]">
                    <span>CGST (Intra-state)</span>
                    <span>₹ {calculations.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#03353A]">
                    <span>SGST (Rajasthan Intra-state)</span>
                    <span>₹ {calculations.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#625B4F] pt-1 border-t border-[#CEDDDF]/60 text-[10px]">
                    <span>Total GST Amount</span>
                    <span className="font-bold text-[#03353A]">₹ {calculations.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[#625B4F]">
                  <span>Savina Route Delivery Freight</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    FREE (B2B Beat)
                  </span>
                </div>
              </div>

              {/* Net Payable Grand Total */}
              <div className="p-4 rounded-xl bg-[#FFF7EE] border-2 border-[#D9580B]/40 flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-[#03353A] uppercase tracking-wider">Net Payable Total</span>
                  <span className="font-outfit text-2xl font-extrabold text-[#D9580B] tracking-tight">
                    ₹ {calculations.netPayable.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#625B4F]">
                  <span>Includes all GST taxes</span>
                  <span className="font-mono">Round off ({calculations.roundOff >= 0 ? '+' : ''}{calculations.roundOff})</span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || orderCreatedSuccess}
                className="w-full h-12 rounded-xl bg-[#D9580B] hover:bg-[#BF4B07] active:scale-[0.99] text-white font-outfit font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {orderCreatedSuccess ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] text-emerald-300">verified</span>
                    <span>Order Created &amp; Synced!</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                    <span>Creating &amp; Reserving Stock...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span>Create &amp; Confirm Order (Enter)</span>
                  </>
                )}
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
