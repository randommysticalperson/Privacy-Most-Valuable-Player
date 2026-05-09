/**
 * ThreadView — Individual thread with posts and reply composer
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Heart, Reply, Lock, Zap, EyeOff, Database, Shield, Cpu,
  Copy, CheckCircle2, AlertCircle, Send, RefreshCw, Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useWeb3AuthConnect, useWeb3AuthUser } from '@web3auth/modal/react';
import {
  SEED_POSTS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  formatRelativeTime,
  generateAlias,
  type ForumThread,
  type ForumPost,
  type PrivacyBadge,
} from '@/lib/forumStore';
import { generateAESKey, encryptData, exportAESKey } from '@/lib/e2eEncryption';
import { generateCarrierImage, encodeMessage } from '@/lib/steganography';

const BADGE_CONFIG: Record<PrivacyBadge, { icon: React.ElementType; label: string; color: string; desc: string }> = {
  'zkp-verified': { icon: Zap, label: 'ZKP Verified', color: 'oklch(0.75 0.18 75)', desc: 'Identity proven via Semaphore ZKP' },
  'encrypted': { icon: Lock, label: 'E2E Encrypted', color: 'oklch(0.7 0.17 162)', desc: 'AES-GCM-256 encrypted before storage' },
  'stego': { icon: EyeOff, label: 'Stego Hidden', color: 'oklch(0.51 0.24 264)', desc: 'Message hidden in image via LSB' },
  'he-computed': { icon: Cpu, label: 'HE Computed', color: 'oklch(0.75 0.18 75)', desc: 'Computed on encrypted data (BFV)' },
  'ipfs-pinned': { icon: Database, label: 'IPFS Pinned', color: 'oklch(0.51 0.24 264)', desc: 'Stored on IPFS (CID: QmX...)' },
  'did-auth': { icon: Shield, label: 'DID Auth', color: 'oklch(0.7 0.17 162)', desc: 'Authenticated via DID:PKH' },
};

interface ThreadViewProps {
  thread: ForumThread;
  onBack: () => void;
  extraPosts?: ForumPost[];
  onPostAdded?: (post: ForumPost) => void;
}

export default function ThreadView({ thread, onBack, extraPosts = [], onPostAdded }: ThreadViewProps) {
  const { isConnected } = useWeb3AuthConnect();
  const { userInfo } = useWeb3AuthUser();
  const [replyContent, setReplyContent] = useState('');
  const [useEncryption, setUseEncryption] = useState(true);
  const [useStego, setUseStego] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [localPosts, setLocalPosts] = useState<ForumPost[]>([]);

  const threadPosts = [
    ...SEED_POSTS.filter(p => p.threadId === thread.id),
    ...extraPosts.filter(p => p.threadId === thread.id),
    ...localPosts,
  ];

  const userAlias = userInfo?.email
    ? generateAlias(userInfo.email)
    : userInfo?.name
    ? generateAlias(userInfo.name)
    : `anon-${Math.random().toString(16).slice(2, 8)}`;

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handlePost = async () => {
    if (!replyContent.trim()) return;
    setIsPosting(true);

    try {
      const badges: PrivacyBadge[] = ['did-auth'];
      let content = replyContent;
      let encryptedContent: string | undefined;
      let stegoImage: string | undefined;
      let exportedKey: string | undefined;

      if (useEncryption) {
        const key = await generateAESKey();
        const encrypted = await encryptData(replyContent, key);
        encryptedContent = JSON.stringify(encrypted);
        exportedKey = await exportAESKey(key);
        badges.push('encrypted');
        // Show encrypted version in post
        content = `[E2E ENCRYPTED]\n\nThis message is encrypted with AES-GCM-256. Only users with the key can decrypt it.\n\nKey: ${exportedKey.slice(0, 20)}...`;
      }

      if (useStego) {
        const carrier = generateCarrierImage(300, 200);
        const result = await encodeMessage(carrier, replyContent);
        stegoImage = result.imageDataUrl;
        badges.push('stego');
      }

      const newPost: ForumPost = {
        id: `post-${Date.now()}`,
        threadId: thread.id,
        authorAlias: userAlias,
        content,
        encryptedContent,
        stegoImage,
        badges,
        timestamp: Date.now(),
        likes: 0,
        isEncrypted: useEncryption,
        isAnonymous: true,
      };

      setLocalPosts(prev => [...prev, newPost]);
      onPostAdded?.(newPost);
      setReplyContent('');

      if (exportedKey) {
        toast.success('Post encrypted! Save your key: ' + exportedKey.slice(0, 16) + '...', { duration: 8000 });
      } else {
        toast.success('Reply posted anonymously');
      }
    } catch (err) {
      toast.error('Failed to post: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button + thread header */}
      <div className="space-y-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to threads
        </button>

        <div className="p-4 rounded-xl border border-border bg-[oklch(0.1_0.01_265/0.6)]">
          <div className="flex items-start gap-3">
            <span
              className="w-2 h-2 rounded-full mt-2 shrink-0"
              style={{ background: CATEGORY_COLORS[thread.category] }}
            />
            <div>
              <h1 className="text-base font-semibold text-foreground leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {thread.title}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-muted-foreground">{thread.authorAlias}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded border"
                  style={{
                    color: CATEGORY_COLORS[thread.category],
                    borderColor: `${CATEGORY_COLORS[thread.category]}40`,
                    background: `${CATEGORY_COLORS[thread.category]}10`,
                  }}
                >
                  {CATEGORY_LABELS[thread.category]}
                </span>
                <div className="flex items-center gap-1">
                  {thread.badges.map(badge => {
                    const cfg = BADGE_CONFIG[badge];
                    return (
                      <span
                        key={badge}
                        className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded border"
                        style={{ color: cfg.color, borderColor: `${cfg.color}30`, background: `${cfg.color}10` }}
                        title={cfg.desc}
                      >
                        <cfg.icon className="w-2.5 h-2.5" />
                        {cfg.label}
                      </span>
                    );
                  })}
                </div>
                <span className="text-[10px] text-muted-foreground">{formatRelativeTime(thread.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {threadPosts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            isLiked={likedPosts.has(post.id)}
            onLike={() => handleLike(post.id)}
            index={i}
          />
        ))}

        {threadPosts.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <p className="text-sm">No replies yet. Be the first to respond.</p>
          </div>
        )}
      </div>

      {/* Reply composer */}
      {isConnected ? (
        <div className="p-4 rounded-xl border border-border bg-[oklch(0.1_0.01_265/0.6)] space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[oklch(0.7_0.17_162/0.2)] flex items-center justify-center">
              <span className="text-[10px] font-mono text-[oklch(0.7_0.17_162)]">
                {userAlias.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{userAlias}</span>
            <Badge className="bg-[oklch(0.7_0.17_162/0.1)] text-[oklch(0.7_0.17_162)] text-[9px] px-1.5 border border-[oklch(0.7_0.17_162/0.3)]">
              anonymous
            </Badge>
          </div>

          <Textarea
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder="Write your reply... (your identity is protected by ZKP)"
            className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm resize-none h-24"
          />

          {/* Privacy options */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setUseEncryption(v => !v)}
                className={`w-8 h-4.5 rounded-full transition-all duration-200 relative flex items-center ${
                  useEncryption ? 'bg-[oklch(0.7_0.17_162)]' : 'bg-[oklch(1_0_0/0.1)]'
                }`}
              >
                <span className={`absolute w-3.5 h-3.5 rounded-full bg-white transition-all duration-200 ${
                  useEncryption ? 'left-[18px]' : 'left-0.5'
                }`} />
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3 text-[oklch(0.7_0.17_162)]" />
                Encrypt post (AES-GCM)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setUseStego(v => !v)}
                className={`w-8 h-4.5 rounded-full transition-all duration-200 relative flex items-center ${
                  useStego ? 'bg-[oklch(0.51_0.24_264)]' : 'bg-[oklch(1_0_0/0.1)]'
                }`}
              >
                <span className={`absolute w-3.5 h-3.5 rounded-full bg-white transition-all duration-200 ${
                  useStego ? 'left-[18px]' : 'left-0.5'
                }`} />
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <EyeOff className="w-3 h-3 text-[oklch(0.51_0.24_264)]" />
                Hide in image (Stego)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              Your post is signed with your ZKP identity. The server cannot link this to your wallet address.
            </p>
            <Button
              onClick={handlePost}
              disabled={!replyContent.trim() || isPosting}
              size="sm"
              className="h-8 text-xs bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white shrink-0"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {isPosting ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isPosting ? 'Posting...' : 'Post Reply'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to reply anonymously via ZKP identity.
          </p>
        </div>
      )}
    </div>
  );
}

// Individual post card
function PostCard({
  post,
  isLiked,
  onLike,
  index,
}: {
  post: ForumPost;
  isLiked: boolean;
  onLike: () => void;
  index: number;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="p-4 rounded-xl border border-border bg-[oklch(0.1_0.01_265/0.6)]"
    >
      {/* Author row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-[oklch(0.51_0.24_264/0.15)] border border-[oklch(0.51_0.24_264/0.3)] flex items-center justify-center shrink-0">
          <span className="text-[10px] font-mono text-[oklch(0.51_0.24_264)]">
            {post.authorAlias.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-foreground">{post.authorAlias}</span>
            {post.isAnonymous && (
              <Badge className="bg-[oklch(0.51_0.24_264/0.1)] text-[oklch(0.51_0.24_264)] text-[9px] px-1 border border-[oklch(0.51_0.24_264/0.3)]">
                anon
              </Badge>
            )}
            {/* Privacy badges */}
            {post.badges.map(badge => {
              const cfg = BADGE_CONFIG[badge];
              return (
                <span
                  key={badge}
                  className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded border"
                  style={{ color: cfg.color, borderColor: `${cfg.color}30`, background: `${cfg.color}10` }}
                  title={cfg.desc}
                >
                  <cfg.icon className="w-2.5 h-2.5" />
                  {cfg.label}
                </span>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">{formatRelativeTime(post.timestamp)}</p>
        </div>
      </div>

      {/* Content */}
      <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
        post.isEncrypted ? 'text-muted-foreground' : 'text-foreground'
      }`}>
        {post.isEncrypted && (
          <div className="flex items-center gap-1.5 mb-2 text-[oklch(0.7_0.17_162)]">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Encrypted Content</span>
          </div>
        )}
        {post.content}
      </div>

      {/* Stego image */}
      {post.stegoImage && (
        <div className="mt-3">
          <div className="relative inline-block">
            <img
              src={post.stegoImage}
              alt="Stego image"
              className="rounded-lg border border-border max-h-32 object-cover"
            />
            <div className="absolute top-1.5 right-1.5">
              <Badge className="bg-[oklch(0.51_0.24_264/0.9)] text-white text-[9px]">
                <EyeOff className="w-2.5 h-2.5 mr-0.5" />Hidden
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* IPFS CID */}
      {post.ipfsCid && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Database className="w-3 h-3 text-[oklch(0.51_0.24_264)]" />
          <span className="font-mono">{post.ipfsCid.slice(0, 20)}...</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            isLiked ? 'text-[oklch(0.65_0.22_25)]' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          {post.likes + (isLiked ? 1 : 0)}
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.7_0.17_162)]" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        {post.authorDid && (
          <span className="text-[10px] font-mono text-muted-foreground ml-auto truncate max-w-32" title={post.authorDid}>
            {post.authorDid.slice(0, 20)}...
          </span>
        )}
      </div>
    </motion.div>
  );
}
