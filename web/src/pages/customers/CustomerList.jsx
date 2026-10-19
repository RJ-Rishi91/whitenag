import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { api } from '../../api/client.js';

export function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [outstandingOnly, setOutstandingOnly] = useState(false);
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      const q = new URLSearchParams();
      q.set('type', 'customer');
      if (segment) q.set('segment', segment);
      if (selectedArea) q.set('areaId', selectedArea);
      if (search) q.set('search', search);
      if (outstandingOnly) q.set('outstandingOnly', 'true');

      const res = await api.get(`/parties?${q.toString()}`);
      if (res.success) setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/areas').then(res => {
      if (res.success) setAreas(res.data);
    });
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [segment, selectedArea, search, outstandingOnly]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
            Customers Directory
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            B2B wholesale distributors, retail marts and direct B2C accounts
          </p>
        </div>

        <NavLink
          to="/customers/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Customer</span>
        </NavLink>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#EADBC8] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Segment Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSegment('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              segment === '' ? 'bg-[#03353A] text-white' : 'text-[#837561] hover:bg-[#FFF8EC]'
            }`}
          >
            All Segments
          </button>
          <button
            onClick={() => setSegment('b2b')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              segment === 'b2b' ? 'bg-[#03353A] text-white' : 'text-[#837561] hover:bg-[#FFF8EC]'
            }`}
          >
            B2B Wholesale / Marts
          </button>
          <button
            onClick={() => setSegment('b2c')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              segment === 'b2c' ? 'bg-[#03353A] text-white' : 'text-[#837561] hover:bg-[#FFF8EC]'
            }`}
          >
            B2C Direct
          </button>
        </div>

        {/* Area & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="flex items-center gap-1 text-xs text-[#514534] font-semibold cursor-pointer mr-2">
            <input
              type="checkbox"
              checked={outstandingOnly}
              onChange={(e) => setOutstandingOnly(e.target.checked)}
              className="accent-[#D9580B]"
            />
            <span>Due &gt; 0</span>
          </label>

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-2.5 py-1.5 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
          >
            <option value="">All Areas</option>
            {areas.map(a => (
              <option key={a._id} value={a._id}>{a.name}</option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-[#837561] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-[#2B1B12] outline-hidden focus:border-[#D9580B]"
            />
          </div>
        </div>
      </div>

      {/* Customer Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#837561]">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#2B1B12]">No customers found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(cust => (
            <div
              key={cust._id}
              onClick={() => navigate(`/customers/${cust._id}`)}
              className="card-surface p-5 hover:border-[#D9580B] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF1EB] text-[#D9580B]">
                    {cust.segment} • {cust.b2bType}
                  </span>
                  {cust.balance > 0 && (
                    <span className="text-xs font-bold font-['Epilogue'] text-[#7A1F2B] table-nums">
                      Due: ₹{cust.balance.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-[#2B1B12] line-clamp-1">{cust.name}</h4>

                <div className="mt-2 space-y-1 text-xs text-[#837561]">
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#D9580B]" />
                    <span className="font-semibold text-[#2B1B12]">{cust.mobile}</span>
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#D9580B] shrink-0" />
                    <span className="truncate">{cust.address || 'Udaipur'} ({cust.areaId?.name || 'Area'})</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EADBC8] flex items-center justify-between text-xs text-[#03353A] font-semibold">
                <span>View Profile & Ledger</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
