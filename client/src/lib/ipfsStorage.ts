/**
 * ipfsStorage.ts — Decentralized Storage Layer (IPFS via Pinata)
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Architecture:
 * - Data is encrypted client-side BEFORE upload (using e2eEncryption.ts)
 * - Only ciphertext is sent to IPFS — Pinata/IPFS nodes see no plaintext
 * - The CID (Content Identifier) is a hash of the ciphertext — immutable
 * - Retrieval: fetch by CID → decrypt locally
 *
 * Privacy model:
 * - IPFS stores ciphertext only
 * - The encryption key never leaves the browser
 * - Even if IPFS data is public, it's unreadable without the key
 * - CID reveals nothing about content (it's a hash)
 *
 * Note: In demo mode (no Pinata API key), we simulate IPFS with
 * deterministic mock CIDs to demonstrate the flow without real uploads.
 */

import type { EncryptedPayload } from './e2eEncryption';

export interface IPFSUploadResult {
  cid: string;
  size: number;
  url: string;
  pinned: boolean;
  uploadedAt: number;
  isDemoMode: boolean;
}

export interface IPFSStoredItem {
  cid: string;
  name: string;
  encryptedPayload: EncryptedPayload;
  uploadedAt: number;
  size: number;
}

// Pinata public gateway
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

/**
 * Generate a mock CID for demo mode.
 * Real CIDs are SHA-256 based multihashes — this mimics the format.
 */
async function generateMockCID(content: string): Promise<string> {
  const encoded = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  // Format as a CIDv1 base32 mock (starts with 'bafy' like real IPFS CIDs)
  return `bafybeig${hashHex.slice(0, 52)}`;
}

/**
 * Upload encrypted data to IPFS via Pinata API.
 * If no API key is configured, falls back to demo mode with mock CIDs.
 */
export async function uploadToIPFS(
  encryptedPayload: EncryptedPayload,
  name: string,
  pinataApiKey?: string,
  pinataSecretKey?: string
): Promise<IPFSUploadResult> {
  const payloadJson = JSON.stringify(encryptedPayload);
  const size = new TextEncoder().encode(payloadJson).length;

  // Demo mode: simulate IPFS upload with deterministic mock CID
  if (!pinataApiKey || !pinataSecretKey) {
    const cid = await generateMockCID(payloadJson);
    return {
      cid,
      size,
      url: `${IPFS_GATEWAY}/${cid}`,
      pinned: false,
      uploadedAt: Date.now(),
      isDemoMode: true,
    };
  }

  // Real Pinata upload
  const blob = new Blob([payloadJson], { type: 'application/json' });
  const formData = new FormData();
  formData.append('file', blob, `${name}.json`);
  formData.append('pinataMetadata', JSON.stringify({ name }));
  formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.statusText}`);
  }

  const data = await response.json() as { IpfsHash: string; PinSize: number };

  return {
    cid: data.IpfsHash,
    size: data.PinSize,
    url: `${IPFS_GATEWAY}/${data.IpfsHash}`,
    pinned: true,
    uploadedAt: Date.now(),
    isDemoMode: false,
  };
}

/**
 * Retrieve encrypted data from IPFS by CID.
 * In demo mode, returns a stored payload from local state.
 */
export async function retrieveFromIPFS(
  cid: string,
  localStore?: Map<string, EncryptedPayload>
): Promise<EncryptedPayload> {
  // Check local store first (demo mode)
  if (localStore?.has(cid)) {
    return localStore.get(cid)!;
  }

  // Try real IPFS gateway
  const response = await fetch(`${IPFS_GATEWAY}/${cid}`);
  if (!response.ok) {
    throw new Error(`IPFS retrieval failed for CID ${cid}: ${response.statusText}`);
  }

  return response.json() as Promise<EncryptedPayload>;
}

/**
 * In-memory IPFS store for demo mode.
 * Simulates a persistent IPFS node without real network calls.
 */
export class DemoIPFSStore {
  private store: Map<string, EncryptedPayload> = new Map();
  private metadata: Map<string, { name: string; uploadedAt: number; size: number }> = new Map();

  async pin(
    encryptedPayload: EncryptedPayload,
    name: string
  ): Promise<IPFSUploadResult> {
    const payloadJson = JSON.stringify(encryptedPayload);
    const size = new TextEncoder().encode(payloadJson).length;
    const cid = await generateMockCID(payloadJson);

    this.store.set(cid, encryptedPayload);
    this.metadata.set(cid, { name, uploadedAt: Date.now(), size });

    return {
      cid,
      size,
      url: `${IPFS_GATEWAY}/${cid}`,
      pinned: true,
      uploadedAt: Date.now(),
      isDemoMode: true,
    };
  }

  get(cid: string): EncryptedPayload | undefined {
    return this.store.get(cid);
  }

  list(): IPFSStoredItem[] {
    return Array.from(this.store.entries()).map(([cid, payload]) => {
      const meta = this.metadata.get(cid)!;
      return {
        cid,
        name: meta.name,
        encryptedPayload: payload,
        uploadedAt: meta.uploadedAt,
        size: meta.size,
      };
    });
  }

  clear() {
    this.store.clear();
    this.metadata.clear();
  }
}

/**
 * Format a CID for display — truncate the middle.
 */
export function formatCID(cid: string, chars = 8): string {
  if (cid.length <= chars * 2 + 3) return cid;
  return `${cid.slice(0, chars)}...${cid.slice(-chars)}`;
}
