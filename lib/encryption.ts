import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

const STORAGE_KEY = 'zecpay_encrypted';
const SALT_KEY = 'zecpay_salt';

async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

export async function encryptAndStore(data: object, password: string): Promise<void> {
  let salt: Uint8Array;
  const existingSalt = localStorage.getItem(SALT_KEY);
  if (existingSalt) {
    salt = decodeBase64(existingSalt);
  } else {
    salt = nacl.randomBytes(16);
    localStorage.setItem(SALT_KEY, encodeBase64(salt));
  }

  const key = await deriveKey(password, salt);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const message = new TextEncoder().encode(JSON.stringify(data));
  const encrypted = nacl.secretbox(message, nonce, key);

  const blob = {
    nonce: encodeBase64(nonce),
    data: encodeBase64(encrypted),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
}

export async function decryptFromStore(password: string): Promise<object | null> {
  const raw = localStorage.getItem(STORAGE_KEY);
  const saltRaw = localStorage.getItem(SALT_KEY);
  if (!raw || !saltRaw) return null;

  try {
    const salt = decodeBase64(saltRaw);
    const key = await deriveKey(password, salt);
    const blob = JSON.parse(raw);
    const nonce = decodeBase64(blob.nonce);
    const encrypted = decodeBase64(blob.data);
    const decrypted = nacl.secretbox.open(encrypted, nonce, key);
    if (!decrypted) return null;
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null;
  }
}

export function hasStoredData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function clearStoredData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SALT_KEY);
}
