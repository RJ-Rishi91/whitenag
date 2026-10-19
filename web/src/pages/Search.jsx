import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ShoppingCart, Users, Boxes, Receipt, ChevronRight } from 'lucide-react';
import { api } from '../api/client.js';

export function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState({ orders: [], customers: [], items: [], invoices: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function executeSearch() {
      if (!q) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
        if (res.success) setResults(res.results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    executeSearch();
  }, [q]);

  const totalResults =
    (results.orders?.length || 0) +
    (results.customers?.length || 0) +
    (results.items?.length || 0) +
    (results.invoices?.length || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
          Global Search Results
        </h2>
        <p className="text-xs text-[#837561] mt-0.5">
          Showing matching records for query: <strong className="text-[#D9580B]">"{q}"</strong>
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#837561]">Searching all database entities...</div>
      ) : totalResults === 0 ? (
        <div className="card-surface p-12 text-center">
          <SearchIcon className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#2B1B12]">No results found</h3>
          <p className="text-xs text-[#837561] mt-1">Try another search keyword.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Orders */}
          {results.orders?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#837561] flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#D9580B]" />
                <span>Orders ({results.orders.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.orders.map(o => (
                  <div
                    key={o._id}
                    onClick={() => navigate(`/orders/${o._id}`)}
                    className="card-surface p-4 hover:border-[#D9580B] cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-sm text-[#2B1B12]">{o.orderNo}</span>
                      <p className="text-xs text-[#837561]">{o.partyId?.name} ({o.partyId?.mobile})</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm table-nums">₹{Math.round(o.grandTotal)}</div>
                      <span className="text-[10px] uppercase font-semibold text-stone-500">{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {results.customers?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#837561] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#D9580B]" />
                <span>Customers ({results.customers.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.customers.map(c => (
                  <div
                    key={c._id}
                    onClick={() => navigate(`/customers/${c._id}`)}
                    className="card-surface p-4 hover:border-[#D9580B] cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-sm text-[#2B1B12]">{c.name}</span>
                      <p className="text-xs text-[#837561]">{c.mobile} • {c.address || 'Udaipur'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#837561]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          {results.items?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#837561] flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-[#D9580B]" />
                <span>Products & Raw Materials ({results.items.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {results.items.map(item => (
                  <div key={item._id} className="card-surface p-4">
                    <p className="font-bold text-xs text-[#2B1B12]">{item.name}</p>
                    <p className="text-[10px] font-mono text-[#837561]">{item.sku}</p>
                    <div className="mt-2 pt-1 border-t border-stone-100 flex justify-between text-xs">
                      <span>MRP: ₹{item.mrp}</span>
                      <span className="uppercase text-[10px] font-semibold text-stone-500">{item.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
