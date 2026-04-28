/**
 * e2eEncryption.ts — End-to-End Encryption Layer
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Uses browser-native WebCrypto API:
 * - ECDH P-256 for key exchange (derive shared secret without transmitting it)
 * - AES-GCM 256-bit for symmetric encryption
 * - PBKDF2 for key derivation from passphrase (if needed)
 *
 * Security model:
 * - All encryption/decryption happens IN THE BROWSER
 * - Server only ever sees ciphertext (base64-encoded)
 * - IV (nonce) is randomly generated per encryption, stored alongside ciphertext
 * - No plaintext ever leaves the client
 */

const ECDH_PARAMS: EcKeyGenParams = { name: 'ECDH', namedCurve: 'P-256' };
const AES_PARAMS = { name: 'AES-GCM', length: 256 };

export interface EncryptedPayload {
  ciphertext: string;    // base64
  iv: string;            // base64 (12 bytes nonce)
  algorithm: string;     // 'AES-GCM-256'
  encryptedAt: number;
}

export interface ECDHKeyPair {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
  publicKeyB64: string;   // base64 of raw public key bytes (for display)
}

/**
 * Generate an ECDH P-256 key pair for key exchange.
 * The private key stays in the browser — never transmitted.
 */
export async function generateECDHKeyPair(): Promise<ECDHKeyPair> {
  const keyPair = await crypto.subtle.generateKey(ECDH_PARAMS, true, ['deriveKey', 'deriveBits']);

  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  
  // Export raw public key for display
  const rawPublic = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyB64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(rawPublic))));

  return { publicKeyJwk, privateKeyJwk, publicKeyB64 };
}

/**
 * Derive a shared AES key from ECDH key exchange.
 * Both parties can derive the same key without transmitting it.
 */
export async function deriveSharedKey(
  myPrivateKeyJwk: JsonWebKey,
  theirPublicKeyJwk: JsonWebKey
): Promise<CryptoKey> {
  const myPrivateKey = await crypto.subtle.importKey(
    'jwk', myPrivateKeyJwk, ECDH_PARAMS, false, ['deriveKey', 'deriveBits']
  );
  const theirPublicKey = await crypto.subtle.importKey(
    'jwk', theirPublicKeyJwk, ECDH_PARAMS, false, []
  );

  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    AES_PARAMS,
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate an AES-GCM key directly (for self-encryption / local storage).
 * Used when encrypting data for yourself (e.g., personal notes on IPFS).
 */
export async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(AES_PARAMS, true, ['encrypt', 'decrypt']);
}

/**
 * Export an AES key to base64 for storage/display.
 */
export async function exportAESKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

/**
 * Import an AES key from base64.
 */
export async function importAESKey(keyB64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, AES_PARAMS, false, ['encrypt', 'decrypt']);
}

/**
 * Encrypt a plaintext string using AES-GCM.
 * Returns a structured payload with ciphertext + IV.
 * The server only ever stores this payload — never the plaintext.
 */
export async function encryptData(plaintext: string, key: CryptoKey): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit nonce
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    ciphertext: btoa(String.fromCharCode(...Array.from(new Uint8Array(ciphertextBuffer)))),
    iv: btoa(String.fromCharCode(...Array.from(iv))),
    algorithm: 'AES-GCM-256',
    encryptedAt: Date.now(),
  };
}

/**
 * Decrypt an EncryptedPayload using AES-GCM.
 * Returns the original plaintext string.
 */
export async function decryptData(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
  const iv = new Uint8Array(Array.from(atob(payload.iv), c => c.charCodeAt(0)));
  const ciphertext = new Uint8Array(Array.from(atob(payload.ciphertext), c => c.charCodeAt(0)));

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintextBuffer);
}

/**
 * Derive an AES key from a passphrase using PBKDF2.
 * Useful for password-protected local storage (not transmitted).
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt?: Uint8Array
): Promise<{ key: CryptoKey; saltB64: string }> {
  const saltBytes = salt ?? crypto.getRandomValues(new Uint8Array(16));
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    AES_PARAMS,
    false,
    ['encrypt', 'decrypt']
  );

  return {
    key,
    saltB64: btoa(String.fromCharCode(...Array.from(saltBytes))),
  };
}

/**
 * Truncate a base64 string for display purposes.
 */
export function truncateB64(b64: string, chars = 16): string {
  return b64.length > chars * 2 + 3
    ? `${b64.slice(0, chars)}...${b64.slice(-chars)}`
    : b64;
}
