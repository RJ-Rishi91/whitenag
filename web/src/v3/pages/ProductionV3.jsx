import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ProductionV3() {
  const navigate = useNavigate();

  const [recipes] = useState([
    {
      id: 'rec-1',
      name: 'Urad Special Masala Papad (500g Poly)',
      sku: 'NFD-PAP-001',
      baseOutputKg: 100,
      standardYieldPkt: 200,
      materials: [
        { name: 'Urad Mogar Dal Flour (Double Filtered)', stockKg: 850, baseQty: 80, unit: 'kg' },
        { name: 'Black Pepper (Kali Mirch Coarse Crush)', stockKg: 45, baseQty: 3.2, unit: 'kg' },
        { name: 'Compounded Hing (Asafoetida - Hathras)', stockKg: 12, baseQty: 0.4, unit: 'kg' },
        { name: 'Papad Khar / Pure Sajji Powder', stockKg: 60, baseQty: 1.6, unit: 'kg' },
        { name: 'Edible Cottonseed Oil (Refined)', stockKg: 200, baseQty: 4.0, unit: 'L' },
        { name: 'Iodized Salt (Fine Grain)', stockKg: 300, baseQty: 2.8, unit: 'kg' }
      ]
    },
    {
      id: 'rec-2',
      name: 'Rajasthani Loung Sev (1kg Bulk Pack)',
      sku: 'NFD-SEV-004',
      baseOutputKg: 100,
      standardYieldPkt: 100,
      materials: [
        { name: 'Pure Chana Dal Besan (Chana No. 1)', stockKg: 620, baseQty: 75, unit: 'kg' },
        { name: 'Cloves / Loung Fine Powder', stockKg: 30, baseQty: 2.5, unit: 'kg' },
        { name: 'Red Chilli Powder (Mathania Special)', stockKg: 50, baseQty: 3.0, unit: 'kg' },
        { name: 'Refined Groundnut Oil', stockKg: 350, baseQty: 22, unit: 'L' },
        { name: 'Ajwain & Hing Spice Blend', stockKg: 18, baseQty: 1.2, unit: 'kg' }
      ]
    },
    {
      id: 'rec-3',
      name: 'Methi Vacuum Khakhra (200g Crispy Box)',
      sku: 'NFD-KHK-008',
      baseOutputKg: 100,
      standardYieldPkt: 500,
      materials: [
        { name: 'Sharbati Whole Wheat Flour (Atta)', stockKg: 950, baseQty: 82, unit: 'kg' },
        { name: 'Kasuri Methi (Nagaur Shade Dried)', stockKg: 40, baseQty: 4.5, unit: 'kg' },
        { name: 'Haldi & Ajwain Fresh Mix', stockKg: 25, baseQty: 2.0, unit: 'kg' },
        { name: 'Pure Cow Ghee / Sesame Oil Blend', stockKg: 180, baseQty: 12, unit: 'L' }
      ]
    }
  ]);

  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
  const [multiplier, setMultiplier] = useState(2.0); // 2x batch (200 kg)
  const [kneadingBay, setKneadingBay] = useState('Bay #2 (Milling & Kneading)');
  const [shiftSupervisor, setShiftSupervisor] = useState('Shyam Sunder (Morning Shift)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchConfirmed, setBatchConfirmed] = useState(false);

  const activeRecipe = recipes[selectedRecipeIndex];
  const targetOutputKg = activeRecipe.baseOutputKg * multiplier;
  const targetYieldPkt = activeRecipe.standardYieldPkt * multiplier;

  // Check for any raw material deficit
  const materialTable = activeRecipe.materials.map(m => {
    const required = +(m.baseQty * multiplier).toFixed(2);
    const balanceAfter = +(m.stockKg - required).toFixed(2);
    const isDeficit = balanceAfter < 0;
    return {
      ...m,
      required,
      balanceAfter,
      isDeficit
    };
  });

  const hasDeficit = materialTable.some(m => m.isDeficit);

  const handleConfirmBatch = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setBatchConfirmed(true);
    }, 800);
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Manufacturing</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#EA580C]">Production Batch Planner</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Manufacturing & Bill of Materials (BOM)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulate daily production batches, calculate exact raw material consumption, and generate godown transfer slips.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/v3/stock')}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              Raw Material Stock
            </button>
            <button
              type="button"
              onClick={() => navigate('/v3/production')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              Manage Recipe Formulas
            </button>
          </div>
        </div>

        {/* Batch Confirmation Notification */}
        {batchConfirmed && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
              <span>
                Production Batch <strong>#BAT-2024-{Math.floor(1000 + Math.random() * 9000)}</strong> generated successfully! {targetOutputKg} kg allocated to {kneadingBay}.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700">Tally Stock Journal Ready</span>
          </div>
        )}

        {/* 2-Column Batch Builder */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Recipe & Batch Multiplier Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-500">menu_book</span>
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">Select Product Recipe</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">3 Verified BOMs</span>
              </div>

              <div className="space-y-2">
                {recipes.map((rec, idx) => {
                  const isSelected = idx === selectedRecipeIndex;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => {
                        setSelectedRecipeIndex(idx);
                        setBatchConfirmed(false);
                      }}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-50 border-[#EA580C] shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-xs">{rec.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        SKU: {rec.sku} • Base Batch: {rec.baseOutputKg} kg
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Batch Scale Multiplier */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Target Batch Multiplier
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1.0, 1.5, 2.0, 3.0, 5.0].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMultiplier(m);
                        setBatchConfirmed(false);
                      }}
                      className={`py-2 rounded-lg font-mono font-bold text-xs transition-colors border ${
                        multiplier === m
                          ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m}x
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Custom scale factor:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      max="50"
                      value={multiplier}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          setMultiplier(val);
                          setBatchConfirmed(false);
                        }
                      }}
                      className="w-20 h-7 px-2 text-right bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    />
                    <span className="text-[11px] font-mono text-slate-500 font-bold">x</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Target Output Weight:</span>
                    <strong className="text-slate-900 font-mono">{targetOutputKg} kg</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Standard Yield Estimate:</span>
                    <strong className="text-slate-900 font-mono">{targetYieldPkt} packs</strong>
                  </div>
                </div>
              </div>

              {/* Plant Bays & Shift Info */}
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Processing Bay
                  </label>
                  <select
                    value={kneadingBay}
                    onChange={(e) => setKneadingBay(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                  >
                    <option value="Bay #1 (Milling & Roasting)">Bay #1 (Milling & Roasting)</option>
                    <option value="Bay #2 (Milling & Kneading)">Bay #2 (Milling & Kneading)</option>
                    <option value="Bay #3 (Solar Drying Polyhouse)">Bay #3 (Solar Drying Polyhouse)</option>
                    <option value="Bay #4 (Auto Vacuum Packaging)">Bay #4 (Auto Vacuum Packaging)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Shift Supervisor
                  </label>
                  <input
                    type="text"
                    value={shiftSupervisor}
                    onChange={(e) => setShiftSupervisor(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Bill of Materials Computation Table (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Required Raw Material Consumption (BOM Calculation)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time deduction analysis for {activeRecipe.name} ({targetOutputKg} kg target).
                </p>
              </div>

              {hasDeficit ? (
                <span className="px-2.5 py-1 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">warning</span>
                  Stock Shortfall
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  Sufficient Raw Materials
                </span>
              )}
            </div>

            {/* Materials Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Raw Material Ingredient</th>
                    <th className="py-3 px-4 text-right">In Stock (Savina)</th>
                    <th className="py-3 px-4 text-right">Batch Requirement</th>
                    <th className="py-3 px-4 text-right">Stock Balance After</th>
                    <th className="py-3 px-4 text-center">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {materialTable.map((mat, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {mat.name}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {mat.stockKg} {mat.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-[13px]">
                        {mat.required} {mat.unit}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${mat.isDeficit ? 'text-rose-600' : 'text-slate-700'}`}>
                        {mat.balanceAfter} {mat.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {mat.isDeficit ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Shortfall
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Authorization Card */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Authorizing locks {targetOutputKg} kg ingredients in Godown A and prints the workshop issue voucher.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Print BOM Issue Slip
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatch}
                  disabled={isSubmitting || hasDeficit}
                  className="px-5 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {isSubmitting ? 'sync' : 'precision_manufacturing'}
                  </span>
                  <span>{isSubmitting ? 'Allocating...' : 'Authorize Batch & Deduct Stock'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
export default ProductionV3;
