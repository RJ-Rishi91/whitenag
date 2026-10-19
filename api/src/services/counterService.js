import { Counter } from '../models/Counter.js';

export async function getNextSequence(key, prefix = '', padLength = 6, session = null) {
  const options = { new: true, upsert: true };
  if (session) options.session = session;

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    options
  );

  const formattedNumber = String(counter.seq).padStart(padLength, '0');
  return prefix ? `${prefix}${formattedNumber}` : formattedNumber;
}
