/**
 * AES-GCM 256-bit encryption and decryption for database backups using WebCrypto.
 * Protects customer CNICs, password hashes, and accounting records in exported files.
 */

export async function encryptBackup(jsonText: string, password: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error("WebCrypto is required for backup encryption but is unavailable in this environment.");
  }

  const enc = new TextEncoder();
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(jsonText)
  );

  const toHex = (buf: ArrayBuffer | Uint8Array) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  const encryptedPackage = {
    version: '4.0-ENCRYPTED-AES-GCM',
    algorithm: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations: 100000,
    salt: toHex(salt),
    iv: toHex(iv),
    ciphertext: toHex(ciphertext),
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(encryptedPackage, null, 2);
}

export async function decryptBackup(encryptedJsonString: string, password: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error("WebCrypto is required for backup decryption but is unavailable in this environment.");
  }

  const pkg = JSON.parse(encryptedJsonString);
  if (!pkg || pkg.version !== '4.0-ENCRYPTED-AES-GCM') {
    throw new Error("File is not a valid encrypted backup package.");
  }

  const fromHex = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  };

  const salt = fromHex(pkg.salt);
  const iv = fromHex(pkg.iv);
  const ciphertext = fromHex(pkg.ciphertext);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: pkg.iterations || 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      aesKey,
      ciphertext as unknown as BufferSource
    );
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error("Incorrect backup decryption password or corrupted file.");
  }
}
