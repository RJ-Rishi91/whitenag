import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';

export function SearchV3() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = (searchParams.get('q') || '').trim();

  const [results, setResults] = useState({ orders: [], parties: [], items: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults({ orders: [], parties: [], items: [] });
      return;
    }

    async function doSearch() {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        if (res?.success && res.results) {
          const r = res.results;
          setResults({
            orders: (r.orders || []).map(o => ({
              id: o.orderNo || o._id,
              party: o.partyId?.name || 'Customer',
              amount: `₹${(o.totalAmount || 0).toLocaleString('en-IN')}`,
              status: o.status || 'Received',
              link: '/v3/orders'
            })),
            parties: (r.customers || []).map(p => ({
              name: p.businessName || p.name,
              contact: p.contactPerson || p.mobile || 'Store Contact',
              beat: p.city || 'Udaipur',
              phone: p.mobile || '',
              link: '/v3/customers'
            })),
            items: (r.items || []).map(i => ({
              name: i.name,
              sku: i.sku,
              stock: i.productGroup || 'Finished Goods',
              link: '/v3/stock'
            }))
          });
        } else {
          setResults({ orders: [], parties: [], items: [] });
        }
      } catch (err) {
        console.warn('Search failed:', err);
        setResults({ orders: [], parties: [], items: [] });
      } finally {
        setLoading(false);
      }
    }

    doSearch();
  }, [query]);

  const totalFound = results.orders.length + results.parties.length + results.items.length;

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1200px] mx-auto w-full space-y-6">

        {/* Top Header Bar */}
        <div className="pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Enterprise Search</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#EA580C]">Omni Results</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Search Results for "{query}"
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Searching enterprise database...' : `Found ${totalFound} matches across orders, party ledgers, and inventory SKUs.`}
          </p>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xs text-slate-500">Searching records...</div>
          </div>
        ) : totalFound === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
            <div className="font-bold text-slate-800 text-sm">No exact matches found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try searching for customer names, product SKUs (e.g., PAP, SEV), or order numbers.
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Orders Section */}
            {results.orders.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">shopping_bag</span>
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Sales Orders ({results.orders.length})
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {results.orders.map(o => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold font-mono text-slate-900 mr-2">{o.id}</span>
                        <span className="text-slate-700">{o.party}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-slate-900">{o.amount}</span>
                        <button
                          type="button"
                          onClick={() => navigate(o.link)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
                        >
                          View Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parties Section */}
            {results.parties.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">storefront</span>
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Customer Accounts ({results.parties.length})
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {results.parties.map(p => (
                    <div key={p.name} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 mr-2">{p.name}</span>
                        <span className="text-slate-500">({p.contact} • {p.beat})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(p.link)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
                      >
                        Party Profile
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items Section */}
            {results.items.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">inventory_2</span>
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Inventory SKUs ({results.items.length})
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {results.items.map(i => (
                    <div key={i.sku} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold font-mono text-slate-900 mr-2">{i.sku}</span>
                        <span className="text-slate-700">{i.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-slate-600">{i.stock}</span>
                        <button
                          type="button"
                          onClick={() => navigate(i.link)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
                        >
                          Stock Level
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default SearchV3;
