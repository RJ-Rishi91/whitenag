import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Boxes,
  ArrowRightLeft,
  SlidersHorizontal,
  Plus,
  AlertTriangle,
  Search,
  Factory,
  PackageCheck,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../api/client.js';

export function StockOverview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stockLevels, setStockLevels] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryTab, setCategoryTab] = useState('finished'); // 'finished' | 'raw' | 'packaging' | 'other'
  const [selectedGodownId, setSelectedGodownId] = useState('');
  const [search, setSearch] = useState('');

  const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

  const fetchStock = async () => {
    try {
      const q = new URLSearchParams();
      if (categoryTab) q.set('category', categoryTab);
      if (selectedGodownId) q.set('godownId', selectedGodownId);
      if (lowStockOnly) q.set('lowStockOnly', 'true');

      const [levelsRes, godownsRes] = await Promise.all([
        api.get(`/stock/levels?${q.toString()}`),
        api.get('/godowns')
      ]);

      if (levelsRes.success) setStockLevels(levelsRes.data);
      if (godownsRes.success) setGodowns(godownsRes.data);
    } catch (err) {
      console.error('Failed to load stock overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [categoryTab, selectedGodownId, lowStockOnly]);

  const filteredLevels = stockLevels.filter(l => {
    if (!search) return true;
    const nameMatch = l.itemId?.name?.toLowerCase().includes(search.toLowerCase());
    const skuMatch = l.itemId?.sku?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || skuMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Inventory & Stock Engine
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            Physical, reserved & available stock balanced across godowns
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <NavLink
            to="/stock/transfer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#03353A] hover:bg-[#022529] text-white text-xs font-semibold shadow-xs"
          >
            <ArrowRightLeft className="w-4 h-4 stroke-[2]" />
            <span>Godown Transfer</span>
          </NavLink>

          <NavLink
            to="/stock/adjustments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EADBC8] bg-white hover:bg-[#FFF8EC] text-[#2B1B12] text-xs font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#D9580B]" />
            <span>Log Adjustment / Wastage</span>
          </NavLink>

          <NavLink
            to="/items"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EADBC8] bg-white hover:bg-[#FFF8EC] text-[#2B1B12] text-xs font-semibold"
          >
            <span>Item Master</span>
          </NavLink>
        </div>
      </div>

      {/* Category Tabs & Godown Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#EADBC8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category switcher */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'finished', label: 'Finished Goods (Papad, Khakhra...)' },
            { id: 'raw', label: 'Raw Materials (Dals, Spices)' },
            { id: 'packaging', label: 'Packaging (Pouches, Boxes)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategoryTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                categoryTab === tab.id
                  ? 'bg-[#D9580B] text-white shadow-xs'
                  : 'text-[#837561] hover:bg-[#FFF8EC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Godown & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedGodownId}
            onChange={(e) => setSelectedGodownId(e.target.value)}
            className="bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-2.5 py-1.5 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
          >
            <option value="">All Godowns</option>
            {godowns.map(g => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-[#837561] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
            />
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Item SKU & Name</th>
                <th className="py-3 px-4">Godown</th>
                <th className="py-3 px-4 text-center">Physical Stock</th>
                <th className="py-3 px-4 text-center">Reserved</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-center">Safety Level</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#837561]">Loading stock levels...</td>
                </tr>
              ) : filteredLevels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#837561]">No stock found matching filters.</td>
                </tr>
              ) : (
                filteredLevels.map(level => {
                  const isLow = level.available <= (level.itemId?.minStock || 10);
                  const unit = level.itemId?.unitSymbol || 'pcs';

                  return (
                    <tr key={level._id} className="hover:bg-[#FFF8EC]/30">
                      <td className="py-3 px-4">
                        <NavLink to={`/stock/items/${level.itemId?._id}`} className="hover:underline font-bold text-[#2B1B12] block">
                          {level.itemId?.name}
                        </NavLink>
                        <span className="text-[10px] font-mono text-[#837561]">{level.itemId?.sku}</span>
                      </td>

                      <td className="py-3 px-4 text-[#514534]">
                        <span className="font-semibold">{level.godownId?.name}</span>
                        <span className="text-[10px] text-[#837561] block font-mono">{level.godownId?.code}</span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-stone-900 table-nums">
                        {level.physical} {unit}
                      </td>

                      <td className="py-3 px-4 text-center font-semibold text-amber-700 table-nums">
                        {level.reserved} {unit}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-base font-['Epilogue'] text-[#03353A] table-nums">
                        {level.available} {unit}
                      </td>

                      <td className="py-3 px-4 text-center text-[#837561] table-nums">
                        Min: {level.itemId?.minStock || 10} {unit}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Adequate
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
