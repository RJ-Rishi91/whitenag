import React, { useState, useEffect } from 'react';
import { Settings, Users, Shield, MapPin, Building, Ruler, Save, Plus } from 'lucide-react';
import { api } from '../../api/client.js';

export function SettingsHub() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [areas, setAreas] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Area Modal / State
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaCode, setNewAreaCode] = useState('');

  const loadData = async () => {
    try {
      const [uRes, rRes, aRes, gRes, unRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
        api.get('/areas'),
        api.get('/godowns'),
        api.get('/units')
      ]);

      if (uRes.success) setUsers(uRes.data);
      if (rRes.success) setRoles(rRes.data);
      if (aRes.success) setAreas(aRes.data);
      if (gRes.success) setGodowns(gRes.data);
      if (unRes.success) setUnits(unRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateArea = async (e) => {
    e.preventDefault();
    if (!newAreaName) return;
    try {
      const res = await api.post('/areas', {
        name: newAreaName,
        code: newAreaCode || newAreaName.replace(/\s+/g, '-').toUpperCase()
      });
      if (res.success) {
        setNewAreaName('');
        setNewAreaCode('');
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to add area');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
          Settings & Administration
        </h2>
        <p className="text-xs text-[#837561] mt-0.5">
          User access control, role permissions, area masters and Tally ledger mappings
        </p>
      </div>

      {/* Tabs */}
      <div className="card-surface p-3.5 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'users', label: 'Users & Passwords', icon: Users },
          { id: 'roles', label: 'Role Permissions Matrix', icon: Shield },
          { id: 'areas', label: 'Udaipur Areas (31)', icon: MapPin },
          { id: 'godowns', label: 'Godowns & Warehouses', icon: Building },
          { id: 'units', label: 'Units & Conversions', icon: Ruler }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-[#03353A] text-white shadow-xs'
                  : 'text-[#837561] hover:bg-[#FFF8EC]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="card-surface overflow-hidden">
          <div className="p-4 border-b border-[#EADBC8] flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#2B1B12]">
              Configured Staff Accounts ({users.length})
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-[#FFF8EC]/30">
                  <td className="py-3 px-4 font-bold text-[#2B1B12]">{u.name}</td>
                  <td className="py-3 px-4 font-mono text-stone-700">{u.username}</td>
                  <td className="py-3 px-4 text-[#837561]">{u.mobile}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#03353A] text-white">
                      {u.roleId?.name || 'User'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-[#837561]">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: ROLES */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map(role => (
            <div key={role._id} className="card-surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#2B1B12]">{role.name}</h4>
                  <span className="text-[10px] font-mono text-[#D9580B]">{role.code}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  {role.permissions?.includes('*') ? 'Superuser (*)' : `${role.permissions?.length || 0} Permissions`}
                </span>
              </div>
              <p className="text-xs text-[#837561]">{role.description}</p>
              <div className="flex flex-wrap gap-1 pt-2 border-t border-[#EADBC8]">
                {role.permissions?.map((p, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-[#FFF8EC] border border-[#EADBC8] rounded-md text-[#2B1B12]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: AREAS */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateArea} className="card-surface p-4 flex flex-wrap items-end gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">New Area Name</label>
              <input
                type="text"
                required
                placeholder="e.g. HIRAN MAGRI"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                className="w-48 bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-1.5 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. SEC-1"
                value={newAreaCode}
                onChange={(e) => setNewAreaCode(e.target.value)}
                className="w-32 bg-[#FFF8EC]/60 border border-[#EADBC8] rounded-xl px-3 py-1.5 outline-hidden"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#D9580B] text-white font-bold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Area</span>
            </button>
          </form>

          <div className="card-surface p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
              {areas.map(a => (
                <div key={a._id} className="p-2.5 rounded-xl border border-[#EADBC8] bg-white flex justify-between items-center">
                  <span className="font-bold text-[#2B1B12]">{a.name}</span>
                  <span className="text-[10px] font-mono text-[#837561]">{a.code}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GODOWNS */}
      {activeTab === 'godowns' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {godowns.map(g => (
            <div key={g._id} className="card-surface p-5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-[#2B1B12]">{g.name}</span>
                <span className="text-[10px] font-mono uppercase bg-stone-100 px-2 py-0.5 rounded-full">{g.code}</span>
              </div>
              <p className="text-xs text-[#837561]">{g.address || 'Udaipur'}</p>
              <p className="text-[11px] text-[#03353A] font-semibold pt-2 border-t border-[#EADBC8]">
                Tally Godown: {g.tallyGodown || 'Main Location'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: UNITS */}
      {activeTab === 'units' && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Unit Name</th>
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-4">Tally Unit Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {units.map(u => (
                <tr key={u._id} className="hover:bg-[#FFF8EC]/30">
                  <td className="py-3 px-4 font-bold text-[#2B1B12]">{u.name}</td>
                  <td className="py-3 px-4 font-mono font-semibold">{u.symbol}</td>
                  <td className="py-3 px-4 font-mono text-[#837561]">{u.tallyUnit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
