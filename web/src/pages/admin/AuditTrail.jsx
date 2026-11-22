import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Activity,
  Database,
  Lock,
  ArrowRight,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api/client.js';
import { getSocket } from '../../api/socket.js';

export function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 25);
      if (search) params.append('search', search);
      if (entityFilter) params.append('entity', entityFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const [logsRes, summaryRes] = await Promise.all([
        api.get(`/audit/logs?${params.toString()}`),
        api.get('/audit/summary')
      ]);

      if (logsRes.success) {
        setLogs(logsRes.data || []);
        if (logsRes.pagination) {
          setTotalPages(logsRes.pagination.totalPages || 1);
          setTotalCount(logsRes.pagination.total || 0);
        }
      }

      if (summaryRes.success) {
        setSummary(summaryRes.data || null);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [page, entityFilter, actionFilter, startDate, endDate]);

  // Listen to live audit entries via WebSocket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewAudit = (newEntry) => {
      setLogs((prev) => [newEntry, ...prev]);
      setTotalCount((prev) => prev + 1);
      setSummary((prev) => prev ? {
        ...prev,
        totalModifications: (prev.totalModifications || 0) + 1,
        modificationsLast24h: (prev.modificationsLast24h || 0) + 1
      } : prev);
    };

    socket.on('audit:recorded', handleNewAudit);
    return () => {
      socket.off('audit:recorded', handleNewAudit);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditData();
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">CREATED</span>;
      case 'STATUS_CHANGE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">STATUS CHANGE</span>;
      case 'PAYMENT_COLLECTED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">PAYMENT</span>;
      case 'STOCK_ADJUSTMENT':
      case 'TRANSFER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">STOCK MOVEMENT</span>;
      case 'DELETE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">ARCHIVED (SOFT-DELETE)</span>;
      case 'SYNC_ACK':
      case 'MASTER_MERGE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">TALLY SYNC</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">{action}</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Title & Immutable Vault Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#03353A] text-white flex items-center justify-center font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-[#D9580B]" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-['Epilogue'] text-[#2B1B12]">
              Immutable System Audit Trail & Change Ledger
            </h2>
          </div>
          <p className="text-xs text-[#837561] mt-1">
            Permanent, tamper-proof record of every creation, edit, status transition, payment, and sync event.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Zero-Loss Vault Active</span>
          </div>
          <button
            onClick={() => { setPage(1); fetchAuditData(); }}
            className="p-2 rounded-lg border border-[#EADBC8] bg-white hover:bg-slate-50 text-[#837561] cursor-pointer transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="text-xs font-semibold text-[#837561]">LIFETIME MODIFICATIONS</div>
          <div className="text-2xl font-bold text-[#03353A] mt-1">
            {summary?.totalModifications?.toLocaleString('en-IN') || totalCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Permanently preserved</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="text-xs font-semibold text-[#837561]">ACTIVITY TODAY (24H)</div>
          <div className="text-2xl font-bold text-[#D9580B] mt-1">
            {summary?.modificationsLast24h || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Recorded in real time
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="text-xs font-semibold text-[#837561]">DATA DELETION POLICY</div>
          <div className="text-lg font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <Lock className="w-4 h-4" />
            <span>Never Deleted</span>
          </div>
          <div className="text-[11px] text-[#837561] mt-1">
            Hard deletes blocked at schema
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="text-xs font-semibold text-[#837561]">CONNECTOR SYNC AUDIT</div>
          <div className="text-lg font-bold text-[#03353A] mt-1">
            Tally Outbox Bridge
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Idempotent voucher verification
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#EADBC8] shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by operator, order/invoice #, customer, or summary..."
              className="w-full pl-9 pr-4 py-2 border border-[#EADBC8] rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D9580B]"
            />
          </div>

          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[#EADBC8] rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#D9580B]"
          >
            <option value="">All Entities</option>
            <option value="order">Orders</option>
            <option value="invoice">Invoices</option>
            <option value="payment">Payments</option>
            <option value="party">Customers / Parties</option>
            <option value="stock">Stock & Inventory</option>
            <option value="item">Items & Products</option>
            <option value="sync">Tally Sync Events</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[#EADBC8] rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#D9580B]"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Created</option>
            <option value="UPDATE">Updated</option>
            <option value="STATUS_CHANGE">Status Changes</option>
            <option value="PAYMENT_COLLECTED">Payments Collected</option>
            <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
            <option value="TRANSFER">Godown Transfers</option>
            <option value="DELETE">Archived (Soft Delete)</option>
            <option value="SYNC_ACK">Tally Synchronized</option>
            <option value="MASTER_MERGE">Tally Masters Merged</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-[#03353A] hover:bg-[#02282C] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-[#EADBC8] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#EADBC8] flex items-center justify-between">
          <div className="text-xs font-bold text-[#2B1B12] uppercase tracking-wider">
            Audit Records ({totalCount} Total Events)
          </div>
          <div className="text-[11px] text-[#837561]">
            Page {page} of {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF8EC] border-b border-[#EADBC8] text-[11px] font-bold text-[#837561] uppercase tracking-wider">
                <th className="py-3 px-4">WHEN (TIMESTAMP)</th>
                <th className="py-3 px-4">BY WHOM (ACTOR)</th>
                <th className="py-3 px-4">ACTION</th>
                <th className="py-3 px-4">TARGET / WHAT</th>
                <th className="py-3 px-4">DETAILS & SUMMARY</th>
                <th className="py-3 px-4 text-center">DIFF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADBC8] text-xs text-[#2B1B12]">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#D9580B]" />
                    Loading verified audit ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#837561]">
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        {/* WHEN */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-700">
                          <div className="font-semibold text-[#03353A]">{formatDate(log.at)}</div>
                          <div className="text-[10px] text-slate-400">
                            {log.ip ? `IP: ${log.ip}` : 'Local System'}
                          </div>
                        </td>

                        {/* BY WHOM */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#837561]" />
                            <span>{log.userName || 'System Engine'}</span>
                          </div>
                          <div className="text-[10px] text-[#837561] uppercase tracking-wider">
                            {log.userRole || 'Automated'}
                          </div>
                        </td>

                        {/* ACTION */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>

                        {/* TARGET / WHAT */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-[#03353A] bg-slate-100 px-2 py-0.5 rounded">
                            {log.entityRef || log.entity?.toUpperCase() || 'RECORD'}
                          </span>
                          <div className="text-[10px] text-[#837561] uppercase mt-0.5">
                            {log.entity}
                          </div>
                        </td>

                        {/* DETAILS & SUMMARY */}
                        <td className="py-3 px-4 text-slate-700 max-w-md">
                          <div className="font-medium text-[12px]">{log.summary}</div>
                        </td>

                        {/* DIFF EXPANDER */}
                        <td className="py-3 px-4 text-center">
                          {(log.diff || log.before || log.after) ? (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                              title="Toggle payload diff"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Diff Payload */}
                      {isExpanded && (log.diff || log.before || log.after) && (
                        <tr className="bg-slate-50/80">
                          <td colSpan="6" className="py-3 px-6">
                            <div className="bg-[#0B1120] text-[#E2E8F0] p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                              <div className="text-[#38BDF8] font-bold mb-1">RECORD PAYLOAD & FIELD MODIFICATIONS:</div>
                              {log.diff && (
                                <div className="mb-2">
                                  <span className="text-[#FBBF24]">Diff: </span>
                                  {JSON.stringify(log.diff, null, 2)}
                                </div>
                              )}
                              {log.before && (
                                <div className="mb-1 text-slate-400">
                                  <span>Before: </span>
                                  {JSON.stringify(log.before, null, 2)}
                                </div>
                              )}
                              {log.after && (
                                <div className="text-[#34D399]">
                                  <span>After: </span>
                                  {JSON.stringify(log.after, null, 2)}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#EADBC8] flex items-center justify-between text-xs text-[#837561]">
          <div>
            Showing {logs.length} of {totalCount} records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded border border-[#EADBC8] bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="font-semibold text-[#03353A]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded border border-[#EADBC8] bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AuditTrail;
