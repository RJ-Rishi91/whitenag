import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ShoppingBag, AlertCircle, Save } from 'lucide-react';
import { api } from '../../api/client.js';

export function NewPurchase() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [rawItems, setRawItems] = useState([]);

  const [supplierId, setSupplierId] = useState('');
  const [godownId, setGodownId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [supRes, godownRes, itemRes] = await Promise.all([
          api.get('/parties?type=supplier'),
          api.get('/godowns'),
          api.get('/items?category=raw')
        ]);
        if (supRes.success) {
          setSuppliers(supRes.data);
          if (supRes.data.length > 0) setSupplierId(supRes.data[0]._id);
        }
        if (godownRes.success) {
          setGodowns(godownRes.data);
          if (godownRes.data.length > 0) setGodownId(godownRes.data[0]._id);
        }
        if (itemRes.success) setRawItems(itemRes.data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const addLine = () => {
    if (rawItems.length === 0) return;
    const defaultItem = rawItems[0];
    setLines(prev => [
      ...prev,
      {
        itemId: defaultItem._id,
        sku: defaultItem.sku,
        name: defaultItem.name,
        qty: 50,
        rate: defaultItem.standardCost || defaultItem.mrp,
        unitSymbol: defaultItem.unitSymbol || 'kg',
        gstRate: defaultItem.gstRate || 5
      }
    ]);
  };

  const updateLine = (index, field, value) => {
    setLines(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      if (field === 'itemId') {
        const item = rawItems.find(i => i._id === value);
        if (item) {
          copy[index].sku = item.sku;
          copy[index].name = item.name;
          copy[index].rate = item.standardCost || item.mrp;
          copy[index].unitSymbol = item.unitSymbol || 'kg';
        }
      }
      return copy;
    });
  };

  const removeLine = (index) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  let totalAmount = 0;
  lines.forEach(l => {
    const sub = l.qty * l.rate;
    const gst = (sub * (l.gstRate || 5)) / 100;
    totalAmount += sub + gst;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId || !godownId) {
      setError('Supplier and Godown required.');
      return;
    }
    if (lines.length === 0) {
      setError('Please add at least one raw material line item.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/purchases', {
        supplierId,
        godownId,
        invoiceNo,
        date,
        remarks,
        lines
      });
      if (res.success) {
        navigate('/purchases');
      }
    } catch (err) {
      setError(err.message || 'Failed to record purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/purchases')}
          className="p-2 rounded-xl bg-white border border-[#EADBC8] hover:bg-[#FFF8EC]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Inward Raw Material Purchase
          </h2>
          <p className="text-xs text-[#837561]">
            Record supplier bill and update factory physical stock
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-surface p-6 space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-[#514534] mb-1">Supplier / Mandi Trader *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            >
              {suppliers.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#514534] mb-1">Receiving Godown *</label>
            <select
              value={godownId}
              onChange={(e) => setGodownId(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            >
              {godowns.map(g => (
                <option key={g._id} value={g._id}>{g.name} ({g.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#514534] mb-1">Supplier Bill / Invoice No.</label>
            <input
              type="text"
              placeholder="e.g. BILL-9824"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#514534] mb-1">Invoice Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            />
          </div>
        </div>

        {/* Lines */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="font-bold text-[#2B1B12] uppercase tracking-wider text-[11px]">
              Raw Material Lines ({lines.length})
            </label>
            <button
              type="button"
              onClick={addLine}
              className="px-2.5 py-1 rounded-lg bg-[#D9580B] text-white text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Material</span>
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#837561] italic bg-[#FFF8EC]/20 rounded-xl border border-dashed border-[#EADBC8]">
              No raw materials added. Click 'Add Material' to log supplies.
            </div>
          ) : (
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-[#EADBC8] bg-white flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <select
                      value={line.itemId}
                      onChange={(e) => updateLine(idx, 'itemId', e.target.value)}
                      className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-lg px-2.5 py-1.5 text-xs outline-hidden"
                    >
                      {rawItems.map(item => (
                        <option key={item._id} value={item._id}>
                          {item.name} ({item.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#837561]">Qty:</span>
                    <input
                      type="number"
                      step="any"
                      value={line.qty}
                      onChange={(e) => updateLine(idx, 'qty', Number(e.target.value))}
                      className="w-16 bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-lg px-2 py-1 text-xs font-bold text-right outline-hidden"
                    />
                    <span className="text-[10px] text-[#837561]">{line.unitSymbol}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#837561]">Rate: ₹</span>
                    <input
                      type="number"
                      step="any"
                      value={line.rate}
                      onChange={(e) => updateLine(idx, 'rate', Number(e.target.value))}
                      className="w-16 bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-lg px-2 py-1 text-xs font-bold text-right outline-hidden"
                    />
                  </div>

                  <div className="text-right font-bold table-nums w-20">
                    ₹{Math.round(line.qty * line.rate).toLocaleString('en-IN')}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[#EADBC8] flex items-center justify-between">
          <div className="text-xs">
            <span className="text-[#837561]">Total Inward Value: </span>
            <span className="text-base font-bold font-['Epilogue'] text-[#2B1B12] table-nums">
              ₹{Math.round(totalAmount).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/purchases')}
              className="px-4 py-2 rounded-xl border border-[#EADBC8] hover:bg-stone-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || lines.length === 0}
              className="px-5 py-2 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white font-bold flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Recording Purchase...' : 'Confirm Inward Stock'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
