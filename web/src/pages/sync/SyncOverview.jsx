import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  RefreshCw,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCw,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../api/client.js';
import { MetricCard } from '../../components/MetricCard.jsx';
import { SyncChip } from '../../components/SyncChip.jsx';

export function SyncOverview() {
  const [overview, setOverview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchSyncData = async () => {
    try {
      const [overRes, logRes] = await Promise.all([
        api.get('/sync/overview'),
        api.get('/sync/log')
      ]);

      if (overRes.success) setOverview(overRes);
      if (logRes.success) setLogs(logRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncData();
    const interval = setInterval(fetchSyncData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (logId) => {
    try {
      await api.post(`/sync/retry/${logId}`);
      fetchSyncData();
    } catch (err) {
      alert(err.message || 'Retry failed');
    }
  };

  const connector = overview?.connector || {};
  const counts = overview?.counts || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
            TallyPrime Integration Hub
          </h2>
          <p className="text-xs text-[#837561] mt-0.5">
            XML connector bridge on port 9000, outbound synchronization queue and conflict auditor
          </p>
        </div>

        <button
          onClick={fetchSyncData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EADBC8] bg-white hover:bg-[#FFF8EC] text-[#2B1B12] text-xs font-semibold self-start sm:self-auto cursor-pointer"
        >
          <RotateCw className="w-4 h-4 text-[#D9580B]" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Connector Status Banner */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        connector.isOnline ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${connector.isOnline ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
            <Server className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#2B1B12]">
                Windows PC Tally Connector ({connector.isOnline ? 'Active' : 'Offline / Waiting'})
              </h3>
              <span className={`w-2.5 h-2.5 rounded-full ${connector.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </div>
            <p className="text-xs text-[#837561] mt-0.5">
              Target: <strong>http://localhost:9000</strong> • Tally Company: <strong>{connector.company || 'Test Company'}</strong>
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-[#837561]">
          <span>Last Heartbeat: </span>
          <strong className="text-[#2B1B12]">
            {connector.lastSeen ? new Date(connector.lastSeen).toLocaleTimeString('en-IN') : 'Waiting for connection'}
          </strong>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Synced to Tally"
          value={counts.synced || 0}
          subtext="Vouchers & Masters"
          icon={CheckCircle2}
          color="emerald"
        />

        <MetricCard
          title="Outbox Pending"
          value={counts.pending || 0}
          subtext="Waiting for connector poll"
          icon={Clock}
          color="amber"
        />

        <MetricCard
          title="Sync Failures"
          value={counts.failed || 0}
          subtext="XML / Network rejections"
          icon={XCircle}
          color="maroon"
        />

        <MetricCard
          title="Conflicts"
          value={counts.conflict || 0}
          subtext="Manual review required"
          icon={AlertTriangle}
          color="primary"
        />
      </div>

      {/* Sync Log Stream */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-['Epilogue'] text-[#2B1B12] uppercase tracking-wider">
            Live Synchronization Log
          </h3>
          <span className="text-[10px] text-[#837561]">Auto-updated every 10s</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#837561]">Loading sync activity...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#837561] italic bg-[#FFF8EC]/20 rounded-xl border border-dashed border-[#EADBC8]">
            No sync operations logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[#837561] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Message / Tally GUID</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-[#FFF8EC]/30">
                    <td className="py-2.5 px-3 text-[#837561] whitespace-nowrap">
                      {new Date(log.at).toLocaleTimeString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-stone-600">
                      {log.direction}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#2B1B12] capitalize">
                      {log.entityType}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        log.result === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {log.result}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#514534] font-mono text-[11px] truncate max-w-xs">
                      {log.message}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {log.result === 'failed' && (
                        <button
                          onClick={() => handleRetry(log._id)}
                          className="px-2 py-1 rounded-md bg-[#D9580B] text-white text-[10px] font-bold"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
