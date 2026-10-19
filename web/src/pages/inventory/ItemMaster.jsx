import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Boxes, Search, Plus, Sparkles, Filter } from 'lucide-react';
import { api } from '../../api/client.js';

export function ItemMaster() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const q = category ? `?category=${category}` : '';
        const res = await api.get(`/items${q}`);
        if (res.success) setItems(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category]);

  const filtered = items.filter(i => {
    if (!search) return true;
    const nameMatch = i.name.toLowerCase().includes(search.toLowerCase());
    const skuMatch = i.sku.toLowerCase().includes(search.toLowerCase());
    return nameMatch || skuMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Item Master Catalogue
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            SKU masters, MRPs, HSN codes and packaging variants
          </p>
        </div>
      </div>

      {/* Filter and search */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#EADBC8] shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {['', 'finished', 'raw', 'packaging'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                category === cat ? 'bg-[#03353A] text-white' : 'text-[#837561] hover:bg-[#FFF8EC]'
              }`}
            >
              {cat === '' ? 'All Items' : cat === 'finished' ? 'Finished Goods' : cat === 'raw' ? 'Raw Materials' : 'Packaging'}
            </button>
          ))}
        </div>

        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 text-[#837561] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SKUs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
          />
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4 text-center">Weight</th>
                <th className="py-3 px-4 text-right">MRP (₹)</th>
                <th className="py-3 px-4 text-right">GST %</th>
                <th className="py-3 px-4 text-right">HSN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#837561]">Loading items...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#837561]">No items found.</td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item._id} className="hover:bg-[#FFF8EC]/30">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">{item.sku}</td>
                    <td className="py-3 px-4 font-semibold text-[#2B1B12]">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#837561]">{item.productGroup || '-'}</td>
                    <td className="py-3 px-4 text-center">{item.packWeightGrams ? `${item.packWeightGrams} g` : '-'}</td>
                    <td className="py-3 px-4 text-right font-bold table-nums">₹{item.mrp}</td>
                    <td className="py-3 px-4 text-right text-[#837561]">{item.gstRate}%</td>
                    <td className="py-3 px-4 text-right font-mono text-[#837561]">{item.hsn}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
