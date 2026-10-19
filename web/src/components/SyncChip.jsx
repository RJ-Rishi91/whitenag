import React from 'react';
import { Check, Clock, AlertTriangle, XCircle } from 'lucide-react';

export function SyncChip({ status = 'synced', count = null, onClick }) {
  const normStatus = status?.toLowerCase() || 'synced';

  if (normStatus === 'synced') {
    return (
      <div
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors"
        title="All records synchronized with TallyPrime"
      >
        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
        <span>Tally Synced</span>
      </div>
    );
  }

  if (normStatus === 'pending') {
    return (
      <div
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
        title={`${count || 1} records queued for Tally synchronization`}
      >
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>{count !== null ? `Pending (${count})` : 'Sync Pending'}</span>
      </div>
    );
  }

  if (normStatus === 'conflict') {
    return (
      <div
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
        title="Sync conflict requires manual resolution"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
        <span>Conflict</span>
      </div>
    );
  }

  // Failed
  return (
    <div
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 cursor-pointer hover:bg-rose-100 transition-colors"
      title="Sync failed"
    >
      <XCircle className="w-3.5 h-3.5 text-rose-600" />
      <span>Sync Failed</span>
    </div>
  );
}
