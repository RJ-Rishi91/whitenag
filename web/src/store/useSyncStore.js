import { create } from 'zustand';

export const useSyncStore = create((set) => ({
  connectorOnline: false,
  pendingCount: 0,
  failedCount: 0,
  conflictCount: 0,
  lastSyncedAt: null,
  company: null,

  setSyncStatus: (status) => set((state) => ({ ...state, ...status }))
}));
