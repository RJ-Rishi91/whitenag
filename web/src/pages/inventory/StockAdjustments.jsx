import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, AlertCircle, Save } from 'lucide-react';
import { api } from '../../api/client.js';

export function StockAdjustments() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [itemId, setItemId] = useState('');
  const [godownId, setGodownId] = useState('');
  const [qty, setQty] = useState('');
  const [type, setType] = useState('adjustment'); // 'adjustment' | 'wastage'
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const [iRes, gRes] = await Promise.all([
        api.get('/items'),
        api.get('/godowns')
      ]);
      if (iRes.success && iRes.data.length > 0) {
        setItems(iRes.data);
        setItemId(iRes.data[0]._id);
      }
      if (gRes.success && gRes.data.length > 0) {
        setGodowns(gRes.data);
        setGodownId(gRes.data[0]._id);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemId || !godownId || !qty || Number(qty) === 0) {
      setError('Item, Godown and non-zero quantity are required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/stock/adjustments', {
        itemId,
        godownId,
        qty: Number(qty),
        type,
        remarks
      });
      if (res.success) {
        navigate('/stock');
      }
    } catch (err) {
      setError(err.message || 'Failed to record adjustment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/stock')}
          className="p-2 rounded-xl bg-white border border-[#EADBC8] hover:bg-[#FFF8EC]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Stock Adjustment / Wastage
          </h2>
          <p className="text-xs text-[#837561]">
            Record physical stock count reconciliations or damaged inventory
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-[#514534] mb-1">Adjustment Type *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
          >
            <option value="adjustment">Physical Stock Count Difference (Audit Adjustment)</option>
            <option value="wastage">Factory / Transit Damage or Expiry (Wastage)</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-[#514534] mb-1">Select Item *</label>
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
          >
            {items.map(i => (
              <option key={i._id} value={i._id}>{i.name} ({i.sku})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-[#514534] mb-1">Affected Godown *</label>
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
          <label className="block font-semibold text-[#514534] mb-1">
            Quantity Adjustment (+ for increase, - for decrease) *
          </label>
          <input
            type="number"
            step="any"
            required
            placeholder="e.g. -5 or +10"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs font-bold text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
          />
        </div>

        <div>
          <label className="block font-semibold text-[#514534] mb-1">Reason / Audit Explanation *</label>
          <textarea
            rows={2}
            required
            placeholder="e.g. Broken papad packets during pallet handling, physical audit correction..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
          />
        </div>

        <div className="pt-3 border-t border-[#EADBC8] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/stock')}
            className="px-4 py-2 rounded-xl border border-[#EADBC8] hover:bg-stone-50 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white font-bold flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Posting Adjustment...' : 'Record Adjustment'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
