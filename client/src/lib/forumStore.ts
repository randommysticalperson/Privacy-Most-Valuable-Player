/**
 * forumStore.ts — 論壇資料模型與種子內容
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
  'zero-knowledge': '零知識證明',
  'cryptography': '密碼學',
  'identity': '身份識別',
  'privacy-tech': '隱私技術',
  'decentralized': '去中心化',
  'general': '一般討論',
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

const ADJECTIVES = ['靜默','密碼','幽靈','空值','遮蔽','隱匿','幻影','匿名','暗影','隱藏','零知識','暗黑'];
const NOUNS = ['節點','證明','雜湊','位元組','訊號','向量','金鑰','隨機數','鹽值','碎片','葉節點','根節點'];

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
  if (m < 1) return '剛剛';
  if (m < 60) return `${m} 分鐘前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小時前`;
  return `${Math.floor(h / 24)} 天前`;
}

const NOW = Date.now();

export const SEED_THREADS: ForumThread[] = [
  { id:'thread-1', title:'零知識證明是數位身份的未來——告別密碼洩漏時代', category:'zero-knowledge', authorAlias:'cipher-node-a3f', badges:['zkp-verified','did-auth'], timestamp:NOW-30*60000, postCount:7, lastActivity:NOW-30*60000, tags:['#zkp','#身份識別'], pinned:true },
  { id:'thread-2', title:'DID:PKH vs ENS vs Lens Protocol——哪個去中心化身份方案勝出？', category:'identity', authorAlias:'ghost-proof-f4a', badges:['did-auth','zkp-verified'], timestamp:NOW-10*60000, postCount:19, lastActivity:NOW-10*60000, tags:['#did','#ens'] },
  { id:'thread-3', title:'同態加密實戰：我們真的能在密文上計算嗎？', category:'cryptography', authorAlias:'null-hash-b7c', badges:['encrypted','did-auth'], timestamp:NOW-15*60000, postCount:12, lastActivity:NOW-15*60000, tags:['#fhe','#bfv'] },
  { id:'thread-4', title:'LSB 隱寫術：在明文中隱藏訊息的實用指南', category:'privacy-tech', authorAlias:'veiled-byte-2e1', badges:['stego','encrypted'], timestamp:NOW-60*60000, postCount:5, lastActivity:NOW-60*60000, tags:['#隱寫術','#lsb'] },
  { id:'thread-5', title:'差分隱私與分析：加多少噪音才夠？', category:'privacy-tech', authorAlias:'masked-signal-9b2', badges:['encrypted'], timestamp:NOW-2*3600000, postCount:8, lastActivity:NOW-2*3600000, tags:['#差分隱私','#laplace'] },
  { id:'thread-6', title:'IPFS vs Arweave vs Filecoin：哪個去中心化儲存最適合私密資料？', category:'decentralized', authorAlias:'phantom-vector-c3d', badges:['ipfs-stored','encrypted'], timestamp:NOW-3*3600000, postCount:14, lastActivity:NOW-3*3600000, tags:['#ipfs','#arweave'] },
];

export const SEED_POSTS: ForumPost[] = [
  { id:'post-1-1', threadId:'thread-1', authorAlias:'cipher-node-a3f', content:`零知識證明從根本上改變了信任模型。它不再要求「證明你是誰」，而是讓你證明「我滿足這個條件」，且不洩漏任何其他資訊。\n\nSemaphore 是最清晰的例子：你可以證明自己屬於某個群組，但不揭露你是哪個成員。無效化符（Nullifier）防止重複發訊號，同時不將行為連結到你的身份。`, badges:['zkp-verified','did-auth'], timestamp:NOW-30*60000, likes:14 },
  { id:'post-1-2', threadId:'thread-1', authorAlias:'null-hash-b7c', content:`關鍵洞察在於將「認證」與「授權」分離。你不需要揭露身份，就能證明你擁有某項權限。ZK-SNARK（Groth16、PLONK）讓這在瀏覽器端也能高效執行。`, badges:['encrypted','did-auth'], timestamp:NOW-25*60000, likes:9 },
  { id:'post-1-3', threadId:'thread-1', authorAlias:'veiled-byte-2e1', content:`撤銷問題怎麼解決？如果 ZKP 證明了群組成員資格，要如何移除某人而不讓所有證明失效？目前最佳實踐似乎是 Merkle 樹更新加上無效化符集合。`, badges:['did-auth'], timestamp:NOW-20*60000, likes:6 },
];
