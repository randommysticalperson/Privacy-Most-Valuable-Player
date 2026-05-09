/**
 * forumStore.ts — Forum data model and seed content
 */

export type PrivacyBadge = 'zkp-verified' | 'encrypted' | 'ipfs-stored' | 'did-auth' | 'stego';

export type ThreadCategory =
  | 'zero-knowledge'
  | 'cryptography'
  | 'identity'
  | 'privacy-tech'
  | 'decentralized'
  | 'general';

export const CATEGORY_LABELS: Record<ThreadCategory, string> = {
  'zero-knowledge': 'Zero Knowledge',
  'cryptography': 'Cryptography',
  'identity': 'Identity',
  'privacy-tech': 'Privacy Tech',
  'decentralized': 'Decentralized',
  'general': 'General',
};

export const CATEGORY_COLORS: Record<ThreadCategory, string> = {
  'zero-knowledge': 'oklch(0.51 0.24 264)',
  'cryptography': 'oklch(0.7 0.17 162)',
  'identity': 'oklch(0.75 0.18 75)',
  'privacy-tech': 'oklch(0.51 0.24 264)',
  'decentralized': 'oklch(0.7 0.17 162)',
  'general': 'oklch(0.6 0.01 265)',
};

export interface ForumThread {
  id: string;
  title: string;
  category: ThreadCategory;
  authorAlias: string;
  badges: PrivacyBadge[];
  timestamp: number;
  postCount: number;
  lastActivity: number;
  tags: string[];
  pinned?: boolean;
}

export interface ForumPost {
  id: string;
  threadId: string;
  authorAlias: string;
  content: string;
  encryptedContent?: string;
  stegoImage?: string;
  ipfsCid?: string;
  badges: PrivacyBadge[];
  timestamp: number;
  likes: number;
}

const ADJECTIVES = ['silent','cipher','ghost','null','masked','veiled','phantom','anon','shadow','hidden','zero','dark'];
const NOUNS = ['node','proof','hash','byte','signal','vector','key','nonce','salt','shard','leaf','root'];

export function generateAlias(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const a = Math.abs(h) % ADJECTIVES.length;
  const n = Math.abs(h >> 4) % NOUNS.length;
  const hex = Math.abs(h).toString(16).slice(-3);
  return `${ADJECTIVES[a]}-${NOUNS[n]}-${hex}`;
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const NOW = Date.now();

export const SEED_THREADS: ForumThread[] = [
  { id:'thread-1', title:'Why ZKPs are the future of digital identity — no more password leaks', category:'zero-knowledge', authorAlias:'cipher-node-a3f', badges:['zkp-verified','did-auth'], timestamp:NOW-30*60000, postCount:7, lastActivity:NOW-30*60000, tags:['#zkp','#identity'], pinned:true },
  { id:'thread-2', title:'DID:PKH vs ENS vs Lens Protocol — which decentralized identity wins?', category:'identity', authorAlias:'ghost-proof-f4a', badges:['did-auth','zkp-verified'], timestamp:NOW-10*60000, postCount:19, lastActivity:NOW-10*60000, tags:['#did','#ens'] },
  { id:'thread-3', title:'Homomorphic encryption in practice: can we really compute on ciphertext?', category:'cryptography', authorAlias:'null-hash-b7c', badges:['encrypted','did-auth'], timestamp:NOW-15*60000, postCount:12, lastActivity:NOW-15*60000, tags:['#fhe','#bfv'] },
  { id:'thread-4', title:'LSB steganography: hiding messages in plain sight — a practical guide', category:'privacy-tech', authorAlias:'veiled-byte-2e1', badges:['stego','encrypted'], timestamp:NOW-60*60000, postCount:5, lastActivity:NOW-60*60000, tags:['#steganography','#lsb'] },
  { id:'thread-5', title:'Differential privacy for analytics: how much noise is enough?', category:'privacy-tech', authorAlias:'masked-signal-9b2', badges:['encrypted'], timestamp:NOW-2*3600000, postCount:8, lastActivity:NOW-2*3600000, tags:['#differential-privacy','#laplace'] },
  { id:'thread-6', title:'IPFS vs Arweave vs Filecoin: best decentralized storage for private data?', category:'decentralized', authorAlias:'phantom-vector-c3d', badges:['ipfs-stored','encrypted'], timestamp:NOW-3*3600000, postCount:14, lastActivity:NOW-3*3600000, tags:['#ipfs','#arweave'] },
];

export const SEED_POSTS: ForumPost[] = [
  { id:'post-1-1', threadId:'thread-1', authorAlias:'cipher-node-a3f', content:`ZKPs fundamentally change the trust model. Instead of "prove who you are", they let you prove "I satisfy this predicate" without revealing anything else.\n\nSemaphore is the cleanest example: you prove you're in a group without revealing which member you are. The nullifier prevents double-signaling without linking to your identity.`, badges:['zkp-verified','did-auth'], timestamp:NOW-30*60000, likes:14 },
  { id:'post-1-2', threadId:'thread-1', authorAlias:'null-hash-b7c', content:`The key insight is separating authentication from authorization. Your identity doesn't need to be revealed to prove you have permission. ZK-SNARKs (Groth16, PLONK) make this computationally feasible even in browsers now.`, badges:['encrypted','did-auth'], timestamp:NOW-25*60000, likes:9 },
  { id:'post-1-3', threadId:'thread-1', authorAlias:'veiled-byte-2e1', content:`What about revocation? If a ZKP proves membership in a group, how do you remove someone without invalidating all proofs? Merkle tree updates + nullifier sets seem to be the current best practice.`, badges:['did-auth'], timestamp:NOW-20*60000, likes:6 },
];
