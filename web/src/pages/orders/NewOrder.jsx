import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../../api/client.js';

export function NewOrder() {
  const navigate = useNavigate();

  // Master data
  const [customers, setCustomers] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [items, setItems] = useState([]);
  const [customerRates, setCustomerRates] = useState({});

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedGodownId, setSelectedGodownId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Cash on Delivery');
  const [deliveryDetails, setDeliveryDetails] = useState('');
  const [remarks, setRemarks] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [orderLines, setOrderLines] = useState([]);
  const [stockLevels, setStockLevels] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, godownRes, itemRes, stockRes] = await Promise.all([
          api.get('/parties?type=customer'),
          api.get('/godowns'),
          api.get('/items?category=finished'),
          api.get('/stock/levels')
        ]);

        if (custRes.success) setCustomers(custRes.data);
        if (godownRes.success) {
          setGodowns(godownRes.data);
          // Default to first warehouse
          if (godownRes.data.length > 0) setSelectedGodownId(godownRes.data[0]._id);
        }
        if (itemRes.success) setItems(itemRes.data);
        if (stockRes.success) {
          const map = {};
          stockRes.data.forEach(l => {
            const key = `${l.godownId._id || l.godownId}-${l.itemId._id || l.itemId}`;
            map[key] = l.available;
          });
          setStockLevels(map);
        }
      } catch (err) {
        console.error('Failed to load initial master data:', err);
      }
    }
    loadData();
  }, []);

  // When customer changes, load customer rate memory
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerRates({});
      return;
    }

    api.get(`/parties/${selectedCustomerId}/rates`).then(res => {
      if (res.success) {
        const rateMap = {};
        res.data.forEach(r => {
          rateMap[r.itemId._id || r.itemId] = r.rate;
        });
        setCustomerRates(rateMap);
      }
    });
  }, [selectedCustomerId]);

  const selectedCustomer = customers.find(c => c._id === selectedCustomerId);

  // Filter items by product group
  const productGroups = ['ALL', 'PAPAD', 'KHAKHRA', 'NAMKEEN', 'AACHAR', 'MASALA'];
  const filteredItems = items.filter(i => {
    if (selectedGroup === 'ALL') return true;
    return i.productGroup?.toUpperCase() === selectedGroup;
  });

  // Add or increment item in order lines
  const addItemToOrder = (item) => {
    setOrderLines(prev => {
      const existing = prev.find(line => line.itemId === item._id);
      if (existing) {
        return prev.map(line =>
          line.itemId === item._id
            ? { ...line, qty: line.qty + 1 }
            : line
        );
      }

      // Check last suggested rate for this customer, else fallback to MRP
      const lastRate = customerRates[item._id];
      const initialRate = lastRate !== undefined ? lastRate : item.mrp;

      return [
        ...prev,
        {
          itemId: item._id,
          sku: item.sku,
          name: item.name,
          unitSymbol: item.unitSymbol || 'pcs (pack)',
          qty: 1,
          rate: initialRate,
          mrp: item.mrp,
          lastRate: lastRate,
          discount: 0,
          taxRate: item.gstRate || 5
        }
      ];
    });
  };

  const updateLineQty = (itemId, delta) => {
    setOrderLines(prev =>
      prev
        .map(line => {
          if (line.itemId === itemId) {
            const newQty = line.qty + delta;
            return newQty > 0 ? { ...line, qty: newQty } : null;
          }
          return line;
        })
        .filter(Boolean)
    );
  };

  const updateLineRate = (itemId, newRate) => {
    setOrderLines(prev =>
      prev.map(line =>
        line.itemId === itemId ? { ...line, rate: Number(newRate) } : line
      )
    );
  };

  const removeLine = (itemId) => {
    setOrderLines(prev => prev.filter(line => line.itemId !== itemId));
  };

  // Compute Order Totals
  let subtotal = 0;
  let taxTotal = 0;
  orderLines.forEach(line => {
    const lineSubtotal = line.qty * line.rate;
    const lineTax = (lineSubtotal * (line.taxRate || 5)) / 100;
    subtotal += lineSubtotal;
    taxTotal += lineTax;
  });
  const grandTotal = subtotal + taxTotal;

  // Submit Order
  const handleSubmitOrder = async () => {
    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    if (!selectedGodownId) {
      setError('Please select a fulfillment godown.');
      return;
    }
    if (orderLines.length === 0) {
      setError('Please add at least one product.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/orders', {
        partyId: selectedCustomerId,
        godownId: selectedGodownId,
        paymentTerms,
        deliveryDetails,
        remarks,
        challanNo,
        items: orderLines,
        allowStockOverride: true // Allow admin/order override if physical stock will arrive
      });

      if (res.success) {
        navigate(`/orders/${res.data._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
          New Customer Order Entry
        </h2>
        <p className="text-xs text-[#837561] mt-0.5">
          2-Pane entry with auto-last rate recall and real-time inventory reservation
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-PANE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Customer & Delivery Details (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-surface p-5 space-y-4">
            <h3 className="text-sm font-bold font-['Epilogue'] text-[#2B1B12] uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#D9580B]" />
              <span>Customer Selection</span>
            </h3>

            {/* Customer Picker */}
            <div>
              <label className="block text-xs font-semibold text-[#514534] mb-1">
                Select Customer *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.mobile}) - {c.segment?.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Customer Info Badge */}
            {selectedCustomer && (
              <div className="p-3.5 rounded-xl bg-[#FFF8EC] border border-[#EADBC8] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2B1B12]">{selectedCustomer.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#03353A] text-white uppercase">
                    {selectedCustomer.segment} • {selectedCustomer.b2bType}
                  </span>
                </div>
                <p className="text-[#837561] flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-[#D9580B]" />
                  <span>{selectedCustomer.address || 'Udaipur'} ({selectedCustomer.areaId?.name || 'Area'})</span>
                </p>
                {selectedCustomer.balance > 0 && (
                  <p className="text-[11px] font-semibold text-[#7A1F2B]">
                    Current Outstanding Due: ₹{selectedCustomer.balance.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            )}

            {/* Fulfillment Godown */}
            <div>
              <label className="block text-xs font-semibold text-[#514534] mb-1">
                Dispatching Godown *
              </label>
              <select
                value={selectedGodownId}
                onChange={(e) => setSelectedGodownId(e.target.value)}
                className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
              >
                {godowns.map(g => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-xs font-semibold text-[#514534] mb-1">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
              >
                <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                <option value="UPI on Delivery">UPI on Delivery</option>
                <option value="Credit 7 Days">Credit 7 Days</option>
                <option value="Credit 15 Days">Credit 15 Days</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
              </select>
            </div>

            {/* B2C Challan No (Optional) */}
            {selectedCustomer?.segment === 'b2c' && (
              <div>
                <label className="block text-xs font-semibold text-[#514534] mb-1">
                  Delivery Challan No. (B2C)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty for auto DC-000xxx"
                  value={challanNo}
                  onChange={(e) => setChallanNo(e.target.value)}
                  className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
                />
              </div>
            )}

            {/* Delivery Instructions */}
            <div>
              <label className="block text-xs font-semibold text-[#514534] mb-1">
                Delivery Instructions & Remarks
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Deliver before 2 PM, shop near temple..."
                value={deliveryDetails}
                onChange={(e) => setDeliveryDetails(e.target.value)}
                className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Product Selector & Running Order Lines (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Product Category Pills */}
          <div className="card-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-['Epilogue'] text-[#2B1B12] uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#D9580B]" />
                <span>Product Catalog (Tap to Add)</span>
              </h3>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {productGroups.map(grp => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedGroup === grp
                      ? 'bg-[#D9580B] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-[#FFF8EC]'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
              {filteredItems.map(item => {
                const stockKey = `${selectedGodownId}-${item._id}`;
                const available = stockLevels[stockKey] !== undefined ? stockLevels[stockKey] : 0;
                const lastRate = customerRates[item._id];

                return (
                  <div
                    key={item._id}
                    onClick={() => addItemToOrder(item)}
                    className="p-2.5 rounded-xl border border-[#EADBC8] bg-white hover:border-[#D9580B] hover:shadow-xs cursor-pointer flex flex-col justify-between transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#2B1B12] line-clamp-2">{item.name}</p>
                      <p className="text-[10px] text-[#837561]">{item.packWeightGrams}g • MRP ₹{item.mrp}</p>
                    </div>

                    <div className="mt-2 pt-1 border-t border-stone-100 flex items-center justify-between text-[10px]">
                      {lastRate !== undefined ? (
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          Last: ₹{lastRate}
                        </span>
                      ) : (
                        <span className="text-[#837561]">Ref: ₹{item.mrp}</span>
                      )}
                      <span className={`font-semibold ${available > 10 ? 'text-stone-500' : 'text-amber-600'}`}>
                        {available} in stock
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Running Order Lines List */}
          <div className="card-surface p-5 space-y-4">
            <h3 className="text-sm font-bold font-['Epilogue'] text-[#2B1B12] uppercase tracking-wider">
              Order Items ({orderLines.length})
            </h3>

            {orderLines.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#837561] italic bg-[#FFF8EC]/30 rounded-xl border border-dashed border-[#EADBC8]">
                No items added yet. Click on products above to add to order.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {orderLines.map(line => {
                  const lineTotal = (line.qty * line.rate) * (1 + (line.taxRate || 5) / 100);

                  return (
                    <div
                      key={line.itemId}
                      className="p-3 rounded-xl border border-[#EADBC8] bg-[#FFF8EC]/20 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#2B1B12] truncate">{line.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-[#837561] mt-0.5">
                          <span>MRP: ₹{line.mrp}</span>
                          {line.lastRate !== undefined && (
                            <span className="text-emerald-700 font-medium">Customer Last Rate: ₹{line.lastRate}</span>
                          )}
                        </div>
                      </div>

                      {/* Rate Input */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[#837561]">Rate: ₹</span>
                        <input
                          type="number"
                          value={line.rate}
                          onChange={(e) => updateLineRate(line.itemId, e.target.value)}
                          className="w-16 bg-white border border-[#EADBC8] rounded-lg px-2 py-1 text-xs font-bold text-right outline-hidden focus:border-[#D9580B]"
                        />
                      </div>

                      {/* Qty Steppers */}
                      <div className="flex items-center gap-1.5 bg-white border border-[#EADBC8] rounded-xl px-1.5 py-1">
                        <button
                          type="button"
                          onClick={() => updateLineQty(line.itemId, -1)}
                          className="p-1 hover:bg-stone-100 rounded-md text-stone-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateLineQty(line.itemId, 1)}
                          className="p-1 hover:bg-stone-100 rounded-md text-stone-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right w-20 shrink-0 font-bold font-['Epilogue'] table-nums text-[#2B1B12]">
                        ₹{Math.round(lineTotal).toLocaleString('en-IN')}
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeLine(line.itemId)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Order Totals Box */}
            <div className="pt-3 border-t border-[#EADBC8] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#837561]">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-[#2B1B12] table-nums">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#837561]">
                <span>GST (5% Approx):</span>
                <span className="font-semibold text-[#2B1B12] table-nums">₹{Math.round(taxTotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-bold font-['Epilogue'] text-[#2B1B12] pt-2 border-t border-stone-100">
                <span>Grand Total:</span>
                <span className="text-[#D9580B] table-nums">₹{Math.round(grandTotal).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="button"
              disabled={loading || orderLines.length === 0}
              onClick={handleSubmitOrder}
              className="w-full py-3 px-4 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Reserving Stock & Generating Order...</span>
              ) : (
                <>
                  <span>Confirm Order & Reserve Stock</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
