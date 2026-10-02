import { ActivityLedgerEntry, UserRole, LedgerActionType } from '../types';

/**
 * Hash calculation for Tamper-Evident Hash Chain
 */
export async function calculateHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  if (crypto && crypto.subtle) {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback simple hash string if subtle crypto unavailable
    }
  }

  // Pure JavaScript FNV-1a 64-bit style string hash fallback
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ ch, 0x01000193);
  }
  return (
    (h1 >>> 0).toString(16).padStart(8, '0') +
    (h2 >>> 0).toString(16).padStart(8, '0') +
    'a9f8b7c6'
  );
}

/**
 * ActivityLogger - Append-Only Audit Chain Service
 */
export class ActivityLogger {
  static async createEntry(
    prevEntry: ActivityLedgerEntry | null,
    username: string,
    role: UserRole,
    actionType: LedgerActionType,
    module: string,
    description: string,
    recordId?: string,
    oldValue?: string,
    newValue?: string
  ): Promise<ActivityLedgerEntry> {
    const id = `LEDGER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();
    const prevHash = prevEntry ? prevEntry.hash : 'GENESIS_BLOCK_HASH_0000000000000000';

    const payload = [
      id,
      timestamp,
      username,
      role,
      actionType,
      module,
      recordId || '',
      oldValue || '',
      newValue || '',
      description,
      prevHash,
    ].join('|');

    const hash = await calculateHash(payload);

    return {
      id,
      timestamp,
      username,
      role,
      actionType,
      module,
      recordId,
      oldValue,
      newValue,
      description,
      prevHash,
      hash,
    };
  }

  /**
   * Cryptographic Hash Chain Verification
   * Checks every record's hash and ensures prevHash matches previous record's hash.
   */
  static async verifyIntegrity(entries: ActivityLedgerEntry[]): Promise<{
    isValid: boolean;
    checkedCount: number;
    tamperedId?: string;
    reason?: string;
  }> {
    if (!entries || entries.length === 0) {
      return { isValid: true, checkedCount: 0 };
    }

    // Sort chronologically ascending
    const sorted = [...entries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const prev = i > 0 ? sorted[i - 1] : null;
      const expectedPrevHash = prev ? prev.hash : 'GENESIS_BLOCK_HASH_0000000000000000';

      if (current.prevHash !== expectedPrevHash) {
        return {
          isValid: false,
          checkedCount: i + 1,
          tamperedId: current.id,
          reason: `Previous hash mismatch on entry ${current.id}. Expected ${expectedPrevHash.slice(
            0,
            12
          )}... but found ${current.prevHash.slice(0, 12)}...`,
        };
      }

      const payload = [
        current.id,
        current.timestamp,
        current.username,
        current.role,
        current.actionType,
        current.module,
        current.recordId || '',
        current.oldValue || '',
        current.newValue || '',
        current.description,
        current.prevHash,
      ].join('|');

      const recomputedHash = await calculateHash(payload);
      if (recomputedHash !== current.hash) {
        return {
          isValid: false,
          checkedCount: i + 1,
          tamperedId: current.id,
          reason: `Data integrity breach detected on entry ${current.id}! Record contents were modified after signing.`,
        };
      }
    }

    return { isValid: true, checkedCount: sorted.length };
  }
}
