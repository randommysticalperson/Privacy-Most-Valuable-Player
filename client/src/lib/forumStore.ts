/**
 * forumStore.ts — In-memory forum state management
 * Design: Zero-Knowledge Glass — Privacy-First Anonymous Forum
 *
 * All posts are stored in-memory (no server). In a real deployment:
 * - Post content would be AES-GCM encrypted before storage
 * - Posts would be pinned to IPFS (CID stored, not plaintext)
 * - Author identity is a ZKP nullifier (anonymous but non-repeatable)
 * - Steganographic images can be attached to posts
 */

export type PrivacyBadge = 'zkp-verified' | 'encrypted' | 'stego' | 'he-computed' | 'ipfs-pinned' | 'did-auth';

export interface ForumPost {
  id: string;
  threadId: string;
  authorAlias: string;       // e.g. "anon-7f3a" — derived from ZKP nullifier
  authorDid?: string;        // DID:PKH if wallet-connected
  content: string;           // plaintext (decrypted in browser)
  encryptedContent?: string; // AES-GCM ciphertext (what server sees)
  ipfsCid?: string;          // IPFS CID of encrypted content
  stegoImage?: string;       // data URL of stego image (if attached)
  badges: PrivacyBadge[];
  timestamp: number;
  likes: number;
  isEncrypted: boolean;
  isAnonymous: boolean;
  replyTo?: string;          // parent post ID
}

export interface ForumThread {
  id: string;
  title: string;
  category: ThreadCategory;
  authorAlias: string;
  badges: PrivacyBadge[];
  timestamp: number;
  postCount: number;
  lastActivity: number;
  pinned?: boolean;
  tags: string[];
}

export type ThreadCategory =
  | 'privacy-tech'
  | 'cryptography'
  | 'identity'
  | 'decentralized'
  | 'zero-knowledge'
  | 'general';

export const CATEGORY_LABELS: Record<ThreadCategory, string> = {
  'privacy-tech': 'Privacy Tech',
  'cryptography': 'Cryptography',
  'identity': 'Identity',
  'decentralized': 'Decentralized',
  'zero-knowledge': 'Zero Knowledge',
  'general': 'General',
};

export const CATEGORY_COLORS: Record<ThreadCategory, string> = {
  'privacy-tech': 'oklch(0.51 0.24 264)',
  'cryptography': 'oklch(0.75 0.18 75)',
  'identity': 'oklch(0.7 0.17 162)',
  'decentralized': 'oklch(0.65 0.22 25)',
  'zero-knowledge': 'oklch(0.51 0.24 264)',
  'general': 'oklch(0.6 0.01 265)',
};

// Generate a deterministic anonymous alias from a hash/nullifier
export function generateAlias(seed: string): string {
  const adjectives = ['silent', 'hidden', 'masked', 'veiled', 'cloaked', 'shadowed', 'phantom', 'cipher', 'ghost', 'null'];
  const nouns = ['node', 'key', 'proof', 'hash', 'shard', 'byte', 'signal', 'vector', 'epoch', 'nonce'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const adj = adjectives[h % adjectives.length];
  const noun = nouns[(h >> 4) % nouns.length];
  const num = (h >> 8) & 0xfff;
  return `${adj}-${noun}-${num.toString(16).padStart(3, '0')}`;
}

// Seed data — demo threads
export const SEED_THREADS: ForumThread[] = [
  {
    id: 'thread-1',
    title: 'Why ZKPs are the future of digital identity — no more password leaks',
    category: 'zero-knowledge',
    authorAlias: 'cipher-node-a3f',
    badges: ['zkp-verified', 'did-auth'],
    timestamp: Date.now() - 3600000 * 2,
    postCount: 7,
    lastActivity: Date.now() - 1800000,
    pinned: true,
    tags: ['zkp', 'identity', 'semaphore'],
  },
  {
    id: 'thread-2',
    title: 'Homomorphic encryption in practice: can we really compute on ciphertext?',
    category: 'cryptography',
    authorAlias: 'null-hash-b7c',
    badges: ['encrypted', 'did-auth'],
    timestamp: Date.now() - 3600000 * 5,
    postCount: 12,
    lastActivity: Date.now() - 900000,
    tags: ['fhe', 'bfv', 'seal', 'privacy'],
  },
  {
    id: 'thread-3',
    title: 'LSB steganography: hiding messages in plain sight — a practical guide',
    category: 'privacy-tech',
    authorAlias: 'veiled-byte-2e1',
    badges: ['stego', 'encrypted'],
    timestamp: Date.now() - 3600000 * 8,
    postCount: 5,
    lastActivity: Date.now() - 3600000,
    tags: ['steganography', 'lsb', 'images'],
  },
  {
    id: 'thread-4',
    title: 'DID:PKH vs ENS vs Lens Protocol — which decentralized identity wins?',
    category: 'identity',
    authorAlias: 'ghost-proof-f4a',
    badges: ['did-auth', 'zkp-verified'],
    timestamp: Date.now() - 3600000 * 12,
    postCount: 19,
    lastActivity: Date.now() - 600000,
    tags: ['did', 'ens', 'identity', 'web3'],
  },
  {
    id: 'thread-5',
    title: 'Differential privacy for analytics: how much noise is enough?',
    category: 'privacy-tech',
    authorAlias: 'masked-signal-9b2',
    badges: ['encrypted'],
    timestamp: Date.now() - 3600000 * 24,
    postCount: 8,
    lastActivity: Date.now() - 7200000,
    tags: ['differential-privacy', 'laplace', 'analytics'],
  },
  {
    id: 'thread-6',
    title: 'IPFS vs Arweave vs Filecoin: best decentralized storage for private data?',
    category: 'decentralized',
    authorAlias: 'phantom-vector-c3d',
    badges: ['ipfs-pinned', 'encrypted'],
    timestamp: Date.now() - 3600000 * 36,
    postCount: 14,
    lastActivity: Date.now() - 10800000,
    tags: ['ipfs', 'arweave', 'storage', 'decentralized'],
  },
];

// Seed posts for thread-1
export const SEED_POSTS: ForumPost[] = [
  {
    id: 'post-1-1',
    threadId: 'thread-1',
    authorAlias: 'cipher-node-a3f',
    content: `Zero-knowledge proofs allow you to prove you know something without revealing what that thing is. Applied to identity, this means you can prove "I am a member of this group" without revealing *which* member you are.\n\nSemaphore is the cleanest implementation I've seen — it uses a Merkle tree of identities, and you prove membership via a Groth16 proof. The nullifier prevents double-signaling without linking to your identity.\n\nThe key insight: your identity IS your key pair. No central authority can revoke it, no database can be breached to expose it.`,
    badges: ['zkp-verified', 'did-auth'],
    timestamp: Date.now() - 3600000 * 2,
    likes: 14,
    isEncrypted: false,
    isAnonymous: false,
    authorDid: 'did:pkh:eip155:1:0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  },
  {
    id: 'post-1-2',
    threadId: 'thread-1',
    authorAlias: 'null-hash-b7c',
    content: `The problem with current identity systems is that they're all built around the same flawed assumption: that you need a central party to vouch for you.\n\nWith DID:PKH, your Ethereum address IS your identity. Sign a message, prove you control the key, done. No OAuth, no "login with Google", no password reset emails.\n\nThe next step is combining this with ZKPs so you can prove *attributes* about your identity (age > 18, citizen of X, member of Y) without revealing the underlying data.`,
    badges: ['did-auth'],
    timestamp: Date.now() - 3600000 * 1.5,
    likes: 8,
    isEncrypted: false,
    isAnonymous: true,
  },
  {
    id: 'post-1-3',
    threadId: 'thread-1',
    authorAlias: 'veiled-byte-2e1',
    content: `[ENCRYPTED MESSAGE]\n\nThis post was encrypted with AES-GCM-256 before being stored. Only users with the decryption key can read the original content. The server only sees ciphertext.\n\nCiphertext: 7f3a9b2c...e4d1f8a0\nIV: 3c7e2a1b...9f4d6e8c`,
    encryptedContent: 'eyJjaXBoZXJ0ZXh0IjoiN2YzYTliMmMiLCJpdiI6IjNjN2UyYTFiIn0=',
    badges: ['encrypted', 'ipfs-pinned'],
    timestamp: Date.now() - 3600000,
    likes: 3,
    isEncrypted: true,
    isAnonymous: true,
    ipfsCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
  },
];

// Time formatting
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
