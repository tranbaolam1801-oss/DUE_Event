import { randomUUID } from 'crypto';

// Independent machines can create at the same time without sharing a local counter.
export async function generateEventCode(): Promise<string> {
  return `EV-${new Date().getFullYear()}-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
}
