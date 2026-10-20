import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function SearchV3() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = (searchParams.get('q') || '').trim();

  // Simulated searchable corpus matching real Udaipur operations
  const dataset = {
    orders: [
      { id: 'SO-2024-1026', party: 'Sharma General Store', amount: '₹14,850', status: 'Received', link: '/v3/orders' },
      { id: 'SO-2024-1027', party: 'Mahalaxmi Kirana Mandir', amount: '₹22,400', status: 'Received', link: '/v3/orders' },
      { id: 'SO-2024-1028', party: 'Jodhpur Sweets & Namkeen', amount: '₹38,500', status: 'Packed', link: '/v3/orders' },
      { id: 'SO-2024-1029', party: 'Kailash Provision Store', amount: '₹4,650', status: 'Packed', link: '/v3/orders' },
      { id: 'SO-2024-1030', party: 'Anoop Traders', amount: '₹54,200', status: 'Shipped', link: '/v3/orders' },
      { id: 'SO-2024-1031', party: 'Shri Ram Bhojnalaya', amount: '₹18,600', status: 'Delivered', link: '/v3/orders' }
    ],
    parties: [
      { name: 'Sharma General Store', contact: 'Mr. Ramesh Sharma', beat: 'Hiran Magri (Sec 3-5)', phone: '+91 98290 12345', link: '/v3/customers' },
      { name: 'Mahalaxmi Kirana Mandir', contact: 'Prakash Chandra', beat: 'Savina Main Mandi', phone: '+91 94141 87654', link: '/v3/customers' },
      { name: 'Jodhpur Sweets & Namkeen', contact: 'Bhawani Singh', beat: 'Krishi Mandi Hub', phone: '+91 98280 43210', link: '/v3/customers' },
      { name: 'Kailash Provision Store', contact: 'Kailash Meena', beat: 'UIT Colony', phone: '+91 97840 55443', link: '/v3/customers' },
      { name: 'Anoop Traders', contact: 'Anoop Agarwal', beat: 'Sukher Industrial', phone: '+91 98292 99881', link: '/v3/customers' }
    ],
    items: [
      { name: 'Urad Special Masala Papad (500g)', sku: 'NFD-PAP-001', stock: '280 Pkt', rate: '₹65.00', link: '/v3/stock' },
      { name: 'Urad Hari Mirch Papad (500g)', sku: 'NFD-PAP-014', stock: '110 Pkt', rate: '₹65.00', link: '/v3/stock' },
      { name: 'Rajasthani Loung Sev (1kg Bulk)', sku: 'NFD-SEV-003', stock: '75 Kg', rate: '₹220.00', link: '/v3/stock' },
      { name: 'Methi Vacuum Khakhra (200g)', sku: 'NFD-KHK-008', stock: '45 Box', rate: '₹52.00', link: '/v3/stock' },
      { name: 'Ker Sangri Aachar (500g Glass)', sku: 'NFD-ACH-002', stock: '-12 Jar (Deficit)', rate: '₹155.00', link: '/v3/stock' }
    ]
  };

  const results = useMemo(() => {
    if (!query) {
      return { orders: [], parties: [], items: [] };
    }
    const q = query.toLowerCase();
    return {
      orders: dataset.orders.filter(o => o.id.toLowerCase().includes(q) || o.party.toLowerCase().includes(q)),
      parties: dataset.parties.filter(p => p.name.toLowerCase().includes(q) || p.contact.toLowerCase().includes(q) || p.phone.includes(q) || p.beat.toLowerCase().includes(q)),
      items: dataset.items.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
    };
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
            Found {totalFound} matches across orders, party ledgers, and inventory SKUs.
          </p>
        </div>

        {totalFound === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
            <div className="font-bold text-slate-800 text-sm">No exact matches found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try searching for party names (e.g. Sharma, Mahalaxmi), SKUs (e.g. PAP, SEV), or order numbers.
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
