export const syncSchema = {
  status: {
    type: String,
    enum: ['none', 'pending', 'synced', 'failed', 'conflict'],
    default: 'none'
  },
  tallyGuid: { type: String, default: null },
  tallyAlterId: { type: Number, default: null },
  lastSyncedAt: { type: Date, default: null },
  error: { type: String, default: null }
};
