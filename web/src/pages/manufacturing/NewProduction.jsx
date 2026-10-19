import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Factory, Sparkles, AlertCircle, Save, Check } from 'lucide-react';
import { api } from '../../api/client.js';

export function NewProduction() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedGodownId, setSelectedGodownId] = useState('');
  const [produceQty, setProduceQty] = useState(100);
  const [batchNo, setBatchNo] = useState(`BATCH-${Date.now().toString().slice(-6)}`);
  const [wastage, setWastage] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [activeBOM, setActiveBOM] = useState(null);
  const [consumptionLines, setConsumptionLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial load
  useEffect(() => {
    async function load() {
      try {
        const [prodRes, godownRes] = await Promise.all([
          api.get('/items?category=finished'),
          api.get('/godowns')
        ]);

        if (prodRes.success && prodRes.data.length > 0) {
          setProducts(prodRes.data);
          // Look for Urad Hari Mirch Papad or first item
          const uradPapad = prodRes.data.find(p => p.sku === 'URAD-HARI-MIRCH-PAPAD-500G') || prodRes.data[0];
          setSelectedProductId(uradPapad._id);
        }

        if (godownRes.success && godownRes.data.length > 0) {
          setGodowns(godownRes.data);
          // Default to Factory Godown
          const factory = godownRes.data.find(g => g.type === 'factory') || godownRes.data[0];
          setSelectedGodownId(factory._id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  // When selected product changes, load its active BOM
  useEffect(() => {
    if (!selectedProductId) return;

    api.get(`/boms/for-product/${selectedProductId}`).then(res => {
      if (res.success && res.data) {
        setActiveBOM(res.data);
        scaleBOM(res.data, produceQty);
      } else {
        setActiveBOM(null);
        setConsumptionLines([]);
      }
    }).catch(() => {
      setActiveBOM(null);
      setConsumptionLines([]);
    });
  }, [selectedProductId]);

  // Recalculate BOM lines when produceQty changes
  const scaleBOM = (bom, targetQty) => {
    if (!bom || !bom.lines) return;
    const baseQty = bom.baseQty || 100;
    const ratio = Number(targetQty) / baseQty;

    const scaled = bom.lines.map(line => {
      const calculatedBomQty = Number((line.qty * ratio).toFixed(3));
      return {
        itemId: line.itemId?._id || line.itemId,
        sku: line.itemId?.sku || line.sku,
        name: line.itemId?.name || line.name,
        bomQty: calculatedBomQty,
        actualQty: calculatedBomQty, // default actual to calculated BOM qty
        unitSymbol: line.unitSymbol || 'kg'
      };
    });

    setConsumptionLines(scaled);
  };

  const handleQtyChange = (val) => {
    const q = Number(val);
    setProduceQty(q);
    if (activeBOM) {
      scaleBOM(activeBOM, q);
    }
  };

  const updateActualQty = (idx, val) => {
    setConsumptionLines(prev => {
      const copy = [...prev];
      copy[idx].actualQty = Number(val);
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !selectedGodownId || !activeBOM) {
      setError('Product, Godown and active recipe BOM required.');
      return;
    }
    if (produceQty <= 0) {
      setError('Produce quantity must be positive.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/production', {
        productId: selectedProductId,
        godownId: selectedGodownId,
        bomId: activeBOM._id,
        qty: Number(produceQty),
        batchNo,
        wastage: Number(wastage),
        remarks,
        lines: consumptionLines
      });

      if (res.success) {
        navigate('/manufacturing');
      }
    } catch (err) {
      setError(err.message || 'Production failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/manufacturing')}
          className="p-2 rounded-xl bg-white border border-[#EADBC8] hover:bg-[#FFF8EC]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-['Epilogue'] text-[#2B1B12]">
            New Production Batch Entry (Smart BOM)
          </h2>
          <p className="text-xs text-[#837561]">
            Scale formulation recipes dynamically and track actual vs formula ingredient variances
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Step 1: Batch Configuration Card */}
        <div className="card-surface p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#837561] uppercase tracking-wider">
            1. Batch Formulation Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#514534] mb-1">Target Finished Product *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs font-bold text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
              >
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku}) - {p.packWeightGrams}g
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#514534] mb-1">Batch Output Quantity *</label>
              <input
                type="number"
                min={1}
                required
                value={produceQty}
                onChange={(e) => handleQtyChange(e.target.value)}
                className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs font-bold text-[#03353A] outline-hidden focus:border-[#D9580B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#514534] mb-1">Manufacturing Godown *</label>
              <select
                value={selectedGodownId}
                onChange={(e) => setSelectedGodownId(e.target.value)}
                className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
              >
                {godowns.map(g => (
                  <option key={g._id} value={g._id}>{g.name} ({g.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#514534] mb-1">Batch / Lot Number *</label>
              <input
                type="text"
                required
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#514534] mb-1">Wastage / Scrap (Packs/Kg)</label>
              <input
                type="number"
                min={0}
                value={wastage}
                onChange={(e) => setWastage(e.target.value)}
                className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#514534] mb-1">Batch Remarks / Shift Lead</label>
              <input
                type="text"
                placeholder="e.g. Morning Shift, Machine #2, Ramesh in-charge"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Auto-Scaled BOM Consumption Table */}
        <div className="card-surface p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-[#837561] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D9580B]" />
                <span>2. Auto-Calculated Raw Material Consumption & Variance</span>
              </h3>
              <p className="text-[11px] text-[#837561]">
                Formula based on {activeBOM ? `${activeBOM.name} (v${activeBOM.version})` : 'Default Recipe'}
              </p>
            </div>

            {activeBOM && (
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full self-start">
                BOM Active: Scaled for {produceQty} units
              </span>
            )}
          </div>

          {!activeBOM ? (
            <div className="p-8 text-center text-xs text-[#837561] italic bg-[#FFF8EC]/30 rounded-xl border border-dashed border-[#EADBC8]">
              No active BOM recipe found for this product. Please define a BOM recipe first.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] tracking-wider font-semibold">
                    <th className="pb-2">Raw Material</th>
                    <th className="pb-2 text-right">Standard BOM Qty</th>
                    <th className="pb-2 text-right">Actual Qty Used</th>
                    <th className="pb-2 text-right">Variance</th>
                    <th className="pb-2 text-center">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {consumptionLines.map((line, idx) => {
                    const variance = Number((line.actualQty - line.bomQty).toFixed(3));
                    const isExcess = variance > 0;

                    return (
                      <tr key={idx} className="hover:bg-[#FFF8EC]/30">
                        <td className="py-2.5 font-bold text-[#2B1B12]">
                          {line.name}
                          <span className="block text-[10px] font-mono text-[#837561]">{line.sku}</span>
                        </td>

                        <td className="py-2.5 text-right font-medium text-stone-700 table-nums">
                          {line.bomQty}
                        </td>

                        <td className="py-2.5 text-right">
                          <input
                            type="number"
                            step="any"
                            value={line.actualQty}
                            onChange={(e) => updateActualQty(idx, e.target.value)}
                            className="w-24 bg-white border border-[#EADBC8] rounded-lg px-2 py-1 text-xs font-bold text-right outline-hidden focus:border-[#D9580B]"
                          />
                        </td>

                        <td className="py-2.5 text-right font-bold table-nums">
                          {variance === 0 ? (
                            <span className="text-emerald-700">0.000</span>
                          ) : isExcess ? (
                            <span className="text-amber-700">+{variance}</span>
                          ) : (
                            <span className="text-blue-700">{variance}</span>
                          )}
                        </td>

                        <td className="py-2.5 text-center text-[#837561] font-semibold">
                          {line.unitSymbol}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-4 border-t border-[#EADBC8] flex items-center justify-between">
            <span className="text-[11px] text-[#837561]">
              Confirming automatically consumes raw materials and inwards finished goods in transaction.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/manufacturing')}
                className="px-4 py-2 rounded-xl border border-[#EADBC8] hover:bg-stone-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !activeBOM}
                className="px-5 py-2.5 rounded-xl bg-[#03353A] hover:bg-[#022529] text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Factory className="w-4 h-4" />
                <span>{loading ? 'Confirming Batch...' : 'Confirm Manufacturing Journal'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
