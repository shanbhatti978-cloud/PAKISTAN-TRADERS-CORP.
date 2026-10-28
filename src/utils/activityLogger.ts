import { ActivityLedgerEntry, UserRole, LedgerActionType } from '../types';

/**
 * Secure salt generation using crypto.getRandomValues
 */
export function generateSecureSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  throw new Error("Secure random number generator (crypto.getRandomValues) is required but unavailable.");
}

/**
 * Hash calculation for Tamper-Evident Hash Chain using SHA-256.
 * Fails clearly if WebCrypto is unavailable instead of falling back to weak FNV.
 */
export async function calculateHash(text: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error("WebCrypto (crypto.subtle) is required for cryptographic integrity but is unavailable.");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Enterprise PBKDF2 Password Hashing (100,000 iterations)
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error("WebCrypto (crypto.subtle) is required for password hashing but is unavailable.");
  }
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(derivedKey));
  return 'pbkdf2:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies password against PBKDF2 or legacy salted SHA-256/plaintext hash.
 */
export async function verifyPassword(password: string, salt: string | undefined, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  if (storedHash.startsWith('pbkdf2:')) {
    if (!salt) return false;
    const computed = await hashPassword(password, salt);
    return computed === storedHash;
  }
  // Backward compatibility with previous SHA-256 salted hashes
  if (salt) {
    const legacyComputed = await calculateHash(`SALT:${salt}|PASS:${password}`);
    if (legacyComputed === storedHash) {
      return true;
    }
  }
  // Legacy unhashed comparison
  return storedHash === password;
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
