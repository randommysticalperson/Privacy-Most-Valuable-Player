/**
 * ThreadList — Forum thread listing component
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pin, MessageSquare, Heart, Zap, Lock, EyeOff, Database, BarChart2, Cpu, Shield, ChevronRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  SEED_THREADS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  formatRelativeTime,
  type ForumThread,
  type ThreadCategory,
  type PrivacyBadge,
} from '@/lib/forumStore';

const BADGE_CONFIG: Record<PrivacyBadge, { icon: React.ElementType; label: string; color: string }> = {
  'zkp-verified': { icon: Zap, label: 'ZKP', color: 'oklch(0.75 0.18 75)' },
  'encrypted': { icon: Lock, label: 'E2E', color: 'oklch(0.7 0.17 162)' },
  'stego': { icon: EyeOff, label: 'Stego', color: 'oklch(0.51 0.24 264)' },
  'he-computed': { icon: Cpu, label: 'HE', color: 'oklch(0.75 0.18 75)' },
  'ipfs-pinned': { icon: Database, label: 'IPFS', color: 'oklch(0.51 0.24 264)' },
  'did-auth': { icon: Shield, label: 'DID', color: 'oklch(0.7 0.17 162)' },
};

interface ThreadListProps {
  activeCategory: ThreadCategory | null;
  onThreadSelect: (thread: ForumThread) => void;
  extraThreads?: ForumThread[];
}

export default function ThreadList({ activeCategory, onThreadSelect, extraThreads = [] }: ThreadListProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  const allThreads = [...SEED_THREADS, ...extraThreads];
  const filtered = activeCategory
    ? allThreads.filter(t => t.category === activeCategory)
    : allThreads;

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (sortBy === 'recent') return b.lastActivity - a.lastActivity;
    return b.postCount - a.postCount;
  });

  return (
    <div className="space-y-3">
      {/* Welcome banner — shown only on 'All Posts' view */}
      {!activeCategory && (
        <div className="p-4 rounded-xl border border-[oklch(0.51_0.24_264/0.25)] bg-[oklch(0.51_0.24_264/0.06)] mb-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[oklch(0.51_0.24_264/0.15)] border border-[oklch(0.51_0.24_264/0.3)] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-[oklch(0.51_0.24_264)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Welcome to ZeroForum</h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                An anonymous, privacy-first forum powered by <span className="text-[oklch(0.75_0.18_75)] font-mono text-[10px]">MetaMask Embedded Wallets</span>,{' '}
                <span className="text-[oklch(0.51_0.24_264)] font-mono text-[10px]">Semaphore ZKP</span>,{' '}
                <span className="text-[oklch(0.7_0.17_162)] font-mono text-[10px]">WebCrypto E2E</span>, and{' '}
                <span className="text-[oklch(0.51_0.24_264)] font-mono text-[10px]">IPFS</span>.
                Connect your wallet to post anonymously — your identity is a ZKP nullifier, not a username.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {activeCategory ? CATEGORY_LABELS[activeCategory] : 'All Threads'}
          </h2>
          <p className="text-xs text-muted-foreground">{sorted.length} threads</p>
        </div>
        <div className="flex items-center gap-1">
          {(['recent', 'popular'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all duration-150 ${
                sortBy === s
                  ? 'bg-[oklch(0.51_0.24_264/0.15)] text-[oklch(0.51_0.24_264)] border border-[oklch(0.51_0.24_264/0.3)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'recent' ? 'Recent' : 'Popular'}
            </button>
          ))}
        </div>
      </div>

      {/* Thread cards */}
      <div className="space-y-2">
        {sorted.map((thread, i) => (
          <motion.div
            key={thread.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
          >
            <button
              onClick={() => onThreadSelect(thread)}
              className="w-full text-left p-4 rounded-xl border border-border bg-[oklch(0.1_0.01_265/0.6)] hover:bg-[oklch(0.12_0.01_265/0.8)] hover:border-[oklch(0.51_0.24_264/0.3)] transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                {/* Category dot */}
                <div
                  className="w-2 h-2 rounded-full mt-2 shrink-0"
                  style={{ background: CATEGORY_COLORS[thread.category] }}
                />

                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-start gap-2 mb-1.5">
                    {thread.pinned && (
                      <Pin className="w-3 h-3 text-[oklch(0.75_0.18_75)] shrink-0 mt-0.5" />
                    )}
                    <h3 className="text-sm font-medium text-foreground group-hover:text-[oklch(0.51_0.24_264)] transition-colors leading-snug line-clamp-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {thread.title}
                    </h3>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Author */}
                    <span className="text-[10px] font-mono text-muted-foreground">{thread.authorAlias}</span>

                    {/* Category badge */}
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md border"
                      style={{
                        color: CATEGORY_COLORS[thread.category],
                        borderColor: `${CATEGORY_COLORS[thread.category]}40`,
                        background: `${CATEGORY_COLORS[thread.category]}10`,
                      }}
                    >
                      {CATEGORY_LABELS[thread.category]}
                    </span>

                    {/* Privacy badges */}
                    <div className="flex items-center gap-1">
                      {thread.badges.map(badge => {
                        const cfg = BADGE_CONFIG[badge];
                        return (
                          <span
                            key={badge}
                            className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded border"
                            style={{
                              color: cfg.color,
                              borderColor: `${cfg.color}30`,
                              background: `${cfg.color}10`,
                            }}
                            title={badge}
                          >
                            <cfg.icon className="w-2.5 h-2.5" />
                            {cfg.label}
                          </span>
                        );
                      })}
                    </div>

                    {/* Tags */}
                    {thread.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[9px] text-muted-foreground">#{tag}</span>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MessageSquare className="w-3 h-3" />
                      {thread.postCount}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(thread.lastActivity)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No threads in this category yet.</p>
          <p className="text-xs mt-1">Be the first to start a discussion.</p>
        </div>
      )}
    </div>
  );
}
