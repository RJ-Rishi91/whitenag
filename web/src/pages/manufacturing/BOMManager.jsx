import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { api } from '../../api/client.js';

export function BOMManager() {
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/boms');
        if (res.success) setBoms(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Bill of Materials (BOM) Recipes
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            Formulation recipes, ingredient batch ratios and active product versions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#837561]">Loading recipes...</div>
        ) : boms.length === 0 ? (
          <div className="card-surface p-12 text-center col-span-2">
            <Sparkles className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-xs text-[#837561]">No BOMs defined yet.</p>
          </div>
        ) : (
          boms.map(bom => (
            <div key={bom._id} className="card-surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#2B1B12]">{bom.productId?.name}</h3>
                  <span className="text-[10px] text-[#837561]">
                    {bom.name} (v{bom.version})
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Base: {bom.baseQty} {bom.baseUnitSymbol}
                </span>
              </div>

              {/* Recipe lines */}
              <div className="pt-2 border-t border-[#EADBC8] space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#837561] block mb-1">
                  Formula Ingredients:
                </span>
                {bom.lines?.map((line, idx) => (
                  <div key={idx} className="flex justify-between text-stone-700 py-0.5">
                    <span>{line.name}</span>
                    <span className="font-bold table-nums">{line.qty} {line.unitSymbol}</span>
                  </div>
                ))}
              </div>

              {bom.notes && (
                <p className="text-[11px] text-[#837561] italic pt-2 border-t border-stone-100">
                  {bom.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
