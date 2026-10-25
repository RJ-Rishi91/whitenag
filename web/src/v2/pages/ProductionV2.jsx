import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ManufacturingGears } from '../animations/LottieAnimations.jsx';
import { fireSuccessConfetti } from '../animations/Confetti.js';

export function ProductionV2() {
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState([
    {
      id: 'rec-1',
      name: 'Urad Special Masala Papad (500g)',
      sku: 'NFD-PAP-001',
      baseOutputKg: 100,
      materials: [
        { name: 'Urad Mogar Dal Flour', stockKg: 0, baseQty: 80, unit: 'kg' },
        { name: 'Black Pepper (Kali Mirch Coarse)', stockKg: 0, baseQty: 3.2, unit: 'kg' },
        { name: 'Compounded Hing (Asafoetida)', stockKg: 0, baseQty: 0.4, unit: 'kg' },
        { name: 'Papad Khar / Sajji Powder', stockKg: 0, baseQty: 1.6, unit: 'kg' },
        { name: 'Edible Cottonseed Oil', stockKg: 0, baseQty: 4.0, unit: 'L' }
      ]
    },
    {
      id: 'rec-2',
      name: 'Rajasthani Loung Sev (1kg Bulk)',
      sku: 'NFD-SEV-004',
      baseOutputKg: 100,
      materials: [
        { name: 'Pure Chana Dal Besan', stockKg: 0, baseQty: 75, unit: 'kg' },
        { name: 'Cloves / Loung Powder', stockKg: 0, baseQty: 2.5, unit: 'kg' },
        { name: 'Red Chilli Powder (Mathania)', stockKg: 0, baseQty: 3.0, unit: 'kg' },
        { name: 'Refined Groundnut Oil', stockKg: 0, baseQty: 22, unit: 'L' }
      ]
    },
    {
      id: 'rec-3',
      name: 'Methi Vacuum Khakhra (200g)',
      sku: 'NFD-KHK-008',
      baseOutputKg: 100,
      materials: [
        { name: 'Sharbati Whole Wheat Flour', stockKg: 0, baseQty: 82, unit: 'kg' },
        { name: 'Kasuri Methi (Nagaur Dried)', stockKg: 0, baseQty: 4.5, unit: 'kg' },
        { name: 'Haldi & Ajwain Mix', stockKg: 0, baseQty: 2.0, unit: 'kg' },
        { name: 'Pure Cow Ghee / Oil Blend', stockKg: 0, baseQty: 12, unit: 'L' }
      ]
    }
  ]);

  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
  const [multiplier, setMultiplier] = useState(2.0); // 2x batch (200 kg)
  const [kneadingBay, setKneadingBay] = useState('Bay #2 (Milling & Kneading)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchConfirmed, setBatchConfirmed] = useState(false);

  const activeRecipe = recipes[selectedRecipeIndex];
  const targetOutputKg = activeRecipe.baseOutputKg * multiplier;

  const handleConfirmBatch = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setBatchConfirmed(true);
      fireSuccessConfetti();
    }, 900);
  };

  return (
    <div className="flex flex-col w-full pb-20">
      <div className="px-4 sm:px-8 py-6 max-w-[1600px] mx-auto w-full space-y-6">
        
        {/* Top Context & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#03353A] uppercase tracking-wider">
              <span>Operations</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span>Manufacturing</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-[#D9580B] font-bold">New Batch Entry</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold text-[#111E20] tracking-tight">
                Record Production Batch &amp; BOM Consumption
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[#E8F6F9] text-[#03353A] text-xs font-bold font-mono border border-[#CEDDDF]">
                  #BAT-2024-1025
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white text-[#625B4F] text-xs font-semibold border border-[#EADBC8]">
                  Factory Floor: {kneadingBay}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-white text-[#03353A] text-xs font-bold border border-[#EADBC8] shadow-xs hover:bg-[#FFF7EE] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print Floor Traveler Slip</span>
            </button>
          </div>
        </div>

        {/* Configuration Top Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EADBC8]/60 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EADBC8]/40">
            <div className="flex items-center gap-3">
              <ManufacturingGears size={40} />
              <div>
                <h2 className="font-outfit font-bold text-base text-[#111E20]">
                  Batch Recipe Configuration &amp; Run Details
                </h2>
                <p className="text-xs text-[#625B4F]">Configure line parameters, recipe multiplier, and floor supervisory oversight</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#E8F6F9] px-3 py-1.5 rounded-full text-[#03353A] border border-[#CEDDDF]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wide">Live Scaling Engine Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Recipe Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#625B4F] mb-1">
                Selected Product Recipe
              </label>
              <select
                value={selectedRecipeIndex}
                onChange={(e) => setSelectedRecipeIndex(Number(e.target.value))}
                className="w-full h-11 px-3.5 bg-[#FFF7EE] rounded-xl text-[#111E20] text-xs font-bold border border-[#EADBC8] focus:ring-2 focus:ring-[#D9580B]"
              >
                {recipes.map((r, i) => (
                  <option key={r.id} value={i}>
                    {r.name} ({r.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Multiplier Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#625B4F]">
                  Batch Multiplier
                </label>
                <span className="font-outfit font-extrabold text-sm text-[#D9580B]">{multiplier}x Batch</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-full h-2 bg-[#E2F1F3] rounded-lg appearance-none cursor-pointer accent-[#D9580B] mt-2"
              />
              <div className="flex justify-between text-[10px] text-[#625B4F] mt-1 font-mono">
                <span>0.5x (50kg)</span>
                <span>2x (200kg)</span>
                <span>5x (500kg)</span>
              </div>
            </div>

            {/* Target Output Display */}
            <div className="p-3.5 rounded-xl bg-[#FFF7EE] border border-[#EADBC8] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#625B4F] block">Target Finished Yield</span>
                <span className="font-outfit font-extrabold text-2xl text-[#111E20]">
                  {targetOutputKg.toFixed(0)} kg
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#E8F6F9] text-[#03353A] text-xs font-bold border border-[#CEDDDF]">
                {Math.round(targetOutputKg * 2)} Pouches
              </span>
            </div>
          </div>
        </div>

        {/* Bill of Materials (BOM) Auto-Scaled Ingredients Table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EADBC8]/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-outfit font-bold text-base text-[#111E20]">
              Raw Material Consumption Matrix (Auto-Scaled)
            </h3>
            <span className="text-xs text-[#625B4F]">Savina Raw Godown Inventory</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#EADBC8]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#E8F6F9] text-[#625B4F] font-bold uppercase tracking-wider border-b border-[#CEDDDF]">
                  <th className="py-3 px-4">Raw Ingredient</th>
                  <th className="py-3 px-4">Base 100kg Recipe</th>
                  <th className="py-3 px-4">Required for {targetOutputKg}kg</th>
                  <th className="py-3 px-4">Godown Stock</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADBC8]/50">
                {activeRecipe.materials.map((mat, i) => {
                  const required = (mat.baseQty * multiplier).toFixed(1);
                  const isAvailable = mat.stockKg >= Number(required);
                  return (
                    <tr key={i} className="hover:bg-[#FFF7EE] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#111E20]">{mat.name}</td>
                      <td className="py-3.5 px-4 font-mono text-[#625B4F]">
                        {mat.baseQty} {mat.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#D9580B]">
                        {required} {mat.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#03353A]">
                        {mat.stockKg} {mat.unit} available
                      </td>
                      <td className="py-3.5 px-4">
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Reserved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                            Shortfall
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Footer */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#EADBC8]/40">
            <div className="text-xs text-[#625B4F]">
              Confirming this batch will automatically generate batch travel ticket #BAT-2024-1025 and reserve raw materials in Savina Mandi Godown.
            </div>

            <button
              onClick={handleConfirmBatch}
              disabled={isSubmitting || batchConfirmed}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#D9580B] hover:bg-[#BF4B07] text-white font-outfit font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {batchConfirmed ? (
                <>
                  <span className="material-symbols-outlined text-[18px] text-emerald-300">verified</span>
                  <span>Batch Recorded &amp; Material Deducted!</span>
                </>
              ) : isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  <span>Scaling &amp; Deducting Stock...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
                  <span>Confirm Batch &amp; Deduct Raw Material</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
