import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Save, AlertCircle } from 'lucide-react';
import { api } from '../../api/client.js';

export function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [areas, setAreas] = useState([]);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Udaipur');
  const [pincode, setPincode] = useState('313001');
  const [areaId, setAreaId] = useState('');
  const [segment, setSegment] = useState('b2b');
  const [b2bType, setB2bType] = useState('retailer');
  const [gstin, setGstin] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [creditDays, setCreditDays] = useState(15);
  const [creditLimit, setCreditLimit] = useState(25000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/areas').then(res => {
      if (res.success) {
        setAreas(res.data);
        if (!isEdit && res.data.length > 0) setAreaId(res.data[0]._id);
      }
    });

    if (isEdit) {
      api.get(`/parties/${id}`).then(res => {
        if (res.success) {
          const p = res.data;
          setName(p.name);
          setMobile(p.mobile);
          setAltMobile(p.altMobile || '');
          setAddress(p.address || '');
          setCity(p.city || 'Udaipur');
          setPincode(p.pincode || '313001');
          setAreaId(p.areaId?._id || p.areaId || '');
          setSegment(p.segment || 'b2b');
          setB2bType(p.b2bType || 'retailer');
          setGstin(p.gstin || '');
          setMapsUrl(p.mapsUrl || '');
          setCreditDays(p.creditDays || 0);
          setCreditLimit(p.creditLimit || 0);
        }
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !mobile) {
      setError('Name and mobile number are required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        type: 'customer',
        name,
        mobile,
        altMobile,
        address,
        city,
        pincode,
        areaId,
        segment,
        b2bType: segment === 'b2c' ? 'none' : b2bType,
        gstin,
        mapsUrl,
        creditDays: Number(creditDays),
        creditLimit: Number(creditLimit)
      };

      if (isEdit) {
        await api.put(`/parties/${id}`, payload);
      } else {
        await api.post('/parties', payload);
      }

      navigate('/customers');
    } catch (err) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 rounded-xl bg-white border border-[#EADBC8] hover:bg-[#FFF8EC]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-['Epilogue'] text-[#2B1B12]">
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <p className="text-xs text-[#837561]">Enter customer trade credentials and delivery area</p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-[#514534] mb-1">Customer / Store Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mewar Kirana Store"
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#514534] mb-1">Primary Mobile *</label>
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile"
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#514534] mb-1">Alternate Mobile / Landline</label>
            <input
              type="tel"
              value={altMobile}
              onChange={(e) => setAltMobile(e.target.value)}
              placeholder="Secondary contact"
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#514534] mb-1">Segment</label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            >
              <option value="b2b">B2B (Wholesale / Mart / Retail)</option>
              <option value="b2c">B2C (Direct Consumer)</option>
            </select>
          </div>

          {segment === 'b2b' && (
            <div>
              <label className="block font-semibold text-[#514534] mb-1">Trade Category</label>
              <select
                value={b2bType}
                onChange={(e) => setB2bType(e.target.value)}
                className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
              >
                <option value="retailer">Retailer / Kirana</option>
                <option value="wholesale">Wholesaler</option>
                <option value="distributor">Distributor / Agency</option>
                <option value="other">Horeca / Caterer</option>
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#514534] mb-1">Udaipur Area Cluster *</label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            >
              {areas.map(a => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#514534] mb-1">GSTIN Number</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="e.g. 08ABCDE1234F1Z5"
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-[#514534] mb-1">Street Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop number, market, landmark..."
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-[#514534] mb-1">Google Maps Location Link</label>
            <input
              type="url"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#514534] mb-1">Payment Credit (Days)</label>
            <input
              type="number"
              value={creditDays}
              onChange={(e) => setCreditDays(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#514534] mb-1">Credit Limit (₹)</label>
            <input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              className="w-full bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-2 text-xs outline-hidden focus:border-[#D9580B]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#EADBC8] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-4 py-2 rounded-xl border border-[#EADBC8] hover:bg-stone-50 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#D9580B] hover:bg-[#b54504] text-white font-bold flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Customer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
