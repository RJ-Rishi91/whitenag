import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRightLeft, Plus, Minus, Trash2, AlertCircle, Save } from 'lucide-react';
import { api } from '../../api/client.js';

export function StockTransfer() {
  const navigate = useNavigate();
  const [godowns, setGodowns] = useState([]);
  const [items, setItems] = useState([]);
  const [fromGodownId, setFromGodownId] = useState('');
  const [toGodownId, setToGodownId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [godownRes, itemRes] = await Promise.all([
          api.get('/godowns'),
          api.get('/items')
        ]);
        if (godownRes.success) {
          setGodowns(godownRes.data);
          if (godownRes.data.length >= 2) {
            setFromGodownId(godownRes.data[0]._id);
            setToGodownId(godownRes.data[1]._id);
          }
        }
        if (itemRes.success) setItems(itemRes.data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const addLine = () => {
    if (items.length === 0) return;
    const defaultItem = items[0];
    setLines(prev => [
      ...prev,
      {
        itemId: defaultItem._id,
        sku: defaultItem.sku,
        name: defaultItem.name,
        qty: 10,
        unitSymbol: defaultItem.unitSymbol || 'pcs'
      }
    ]);
  };

  const updateLineItem = (index, itemId) => {
    const item = items.find(i => i._id === itemId);
    if (!item) return;
    setLines(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        itemId: item._id,
        sku: item.sku,
        name: item.name,
        unitSymbol: item.unitSymbol || 'pcs'
      };
      return copy;
    });
  };

  const updateLineQty = (index, qty) => {
    setLines(prev => {
      const copy = [...prev];
      copy[index].qty = Number(qty);
      return copy;
    });
  };

  const removeLine = (index) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromGodownId || !toGodownId) {
      setError('Select both source and target godowns.');
      return;
    }
    if (fromGodownId === toGodownId) {
      setError('Source and target godowns must be different.');
      return;
    }
    if (lines.length === 0) {
      setError('Please add at least one item line to transfer.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/stock/transfers', {
        fromGodownId,
        toGodownId,
        lines,
        remarks
      });
      if (res.success) {
        navigate('/stock');
      }
    } catch (err) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/stock')}
          className="p-2 rounded-xl bg-white border border-[#EADBC8] hover:bg-[#FFF8EC]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Inter-Godown Stock Transfer
          </h2>
          <p className="text-xs text-[#837561]">
            Transfer physical inventory from factory to central or dispatch warehouse
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
            <label className="block font-semibold text-[#514534] mb-1">Source Godown (From) *</label>
            <select
              value={fromGodownId}
              onChange={(e) => setFromGodownId(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            >
              {godowns.map(g => (
                <option key={g._id} value={g._id}>{g.name} ({g.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#514534] mb-1">Target Godown (To) *</label>
            <select
              value={toGodownId}
              onChange={(e) => setToGodownId(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            >
              {godowns.map(g => (
                <option key={g._id} value={g._id}>{g.name} ({g.code})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#514534] mb-1">Transfer Note / Vehicle Details</label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Loading into Van RJ-27-GA-1234 for city market dispatch"
            className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
          />
        </div>

        {/* Transfer Lines */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="font-bold text-[#2B1B12] uppercase tracking-wider text-[11px]">
              Transfer Item Lines ({lines.length})
            </label>
            <button
              type="button"
              onClick={addLine}
              className="px-2.5 py-1 rounded-lg bg-[#D9580B] text-white text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#837561] italic bg-[#FFF8EC]/20 rounded-xl border border-dashed border-[#EADBC8]">
              No items added. Click 'Add Item' to configure shipment.
            </div>
          ) : (
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-[#EADBC8] bg-white flex items-center gap-3">
                  <div className="flex-1">
                    <select
                      value={line.itemId}
                      onChange={(e) => updateLineItem(idx, e.target.value)}
                      className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-lg px-2.5 py-1.5 text-xs outline-hidden"
                    >
                      {items.map(item => (
                        <option key={item._id} value={item._id}>
                          {item.name} ({item.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={(e) => updateLineQty(idx, e.target.value)}
                      className="w-20 bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-lg px-2 py-1 text-xs font-bold text-right outline-hidden"
                    />
                    <span className="text-[10px] text-[#837561]">{line.unitSymbol}</span>
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

        <div className="pt-4 border-t border-[#EADBC8] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/stock')}
            className="px-4 py-2 rounded-xl border border-[#EADBC8] hover:bg-stone-50 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || lines.length === 0}
            className="px-5 py-2 rounded-xl bg-[#03353A] hover:bg-[#022529] text-white font-bold flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{loading ? 'Executing Transfer...' : 'Confirm Transfer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
