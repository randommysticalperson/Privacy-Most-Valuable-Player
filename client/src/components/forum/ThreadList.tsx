/**
 * ThreadList — Forum thread listing with privacy badges
 */

import { useState } from "react";
import { Pin, MessageSquare, Zap, Lock, Eye, Database, BarChart2, Cpu, Shield, TrendingUp } from "lucide-react";
import {
  SEED_THREADS, CATEGORY_LABELS, CATEGORY_COLORS, formatRelativeTime,
  type ForumThread, type ThreadCategory, type PrivacyBadge,
} from "@/lib/forumStore";

const BADGE_CONFIG: Record<PrivacyBadge, { icon: React.ElementType; color: string; label: string }> = {
  "zkp-verified": { icon: Zap,      color: "oklch(0.75 0.18 75)",  label: "ZKP" },
  "encrypted":    { icon: Lock,     color: "oklch(0.7 0.17 162)",  label: "E2E" },
  "ipfs-stored":  { icon: Database, color: "oklch(0.51 0.24 264)", label: "IPFS" },
  "did-auth":     { icon: Shield,   color: "oklch(0.51 0.24 264)", label: "DID" },
  "stego":        { icon: Eye,      color: "oklch(0.7 0.17 162)",  label: "Stego" },
};

interface ThreadListProps {
  activeCategory: ThreadCategory | null;
  onThreadSelect: (t: ForumThread) => void;
  extraThreads: ForumThread[];
}

export default function ThreadList({ activeCategory, onThreadSelect, extraThreads }: ThreadListProps) {
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const allThreads = [...extraThreads, ...SEED_THREADS];
  const filtered = activeCategory ? allThreads.filter(t => t.category === activeCategory) : allThreads;
  const sorted = [...filtered].sort((a, b) =>
    sortBy === "recent" ? b.lastActivity - a.lastActivity : b.postCount - a.postCount
  );

  return (
    <div className="space-y-3">
      {!activeCategory && (
        <div className="p-4 rounded-xl border border-[oklch(0.51_0.24_264/0.25)] bg-[oklch(0.51_0.24_264/0.06)] mb-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[oklch(0.51_0.24_264/0.15)] border border-[oklch(0.51_0.24_264/0.3)] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-[oklch(0.51_0.24_264)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Welcome to ZeroForum</h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                An anonymous, privacy-first forum powered by{" "}
                <span className="text-[oklch(0.75_0.18_75)] font-mono text-[10px]">MetaMask</span>,{" "}
                <span className="text-[oklch(0.51_0.24_264)] font-mono text-[10px]">Semaphore ZKP</span>,{" "}
                <span className="text-[oklch(0.7_0.17_162)] font-mono text-[10px]">WebCrypto E2E</span>, and{" "}
                <span className="text-[oklch(0.51_0.24_264)] font-mono text-[10px]">IPFS</span>.
                Connect your wallet to post — your identity is a ZKP nullifier, not a username.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {activeCategory ? CATEGORY_LABELS[activeCategory] : "All Threads"}
          </h2>
          <p className="text-[10px] text-muted-foreground">{sorted.length} threads</p>
        </div>
        <div className="flex items-center gap-1">
          {(["recent", "popular"] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                sortBy === s
                  ? "bg-[oklch(0.51_0.24_264/0.15)] text-[oklch(0.51_0.24_264)] border border-[oklch(0.51_0.24_264/0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "recent" ? "Recent" : "Popular"}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">No threads in this category yet.</div>
      ) : (
        <div className="space-y-2">
          {sorted.map(thread => (
            <button
              key={thread.id}
              onClick={() => onThreadSelect(thread)}
              className="w-full text-left p-4 rounded-xl border border-border bg-[oklch(0.11_0.01_265/0.5)] hover:border-[oklch(0.51_0.24_264/0.3)] hover:bg-[oklch(0.51_0.24_264/0.04)] transition-all duration-150 group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {thread.pinned ? (
                    <Pin className="w-3.5 h-3.5 text-[oklch(0.75_0.18_75)]" />
                  ) : (
                    <div className="w-2 h-2 rounded-full mt-1" style={{ background: CATEGORY_COLORS[thread.category] }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-foreground group-hover:text-[oklch(0.51_0.24_264)] transition-colors leading-snug">
                      {thread.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground">{thread.authorAlias}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded border"
                      style={{ color: CATEGORY_COLORS[thread.category], borderColor: `${CATEGORY_COLORS[thread.category]}40` }}
                    >
                      {CATEGORY_LABELS[thread.category]}
                    </span>
                    {thread.badges.map(badge => {
                      const cfg = BADGE_CONFIG[badge];
                      return (
                        <span
                          key={badge}
                          className="text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-0.5"
                          style={{ color: cfg.color, borderColor: `${cfg.color}40` }}
                        >
                          <cfg.icon className="w-2.5 h-2.5" />
                          {cfg.label}
                        </span>
                      );
                    })}
                    {thread.tags.map(tag => (
                      <span key={tag} className="text-[10px] text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />{thread.postCount}
                    </span>
                    <span>{formatRelativeTime(thread.lastActivity)}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
