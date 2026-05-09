/**
 * ForumSidebar — Left navigation sidebar for ZeroForum
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 */

import { Link, useLocation } from 'wouter';
import { Shield, Hash, Zap, Database, BarChart2, EyeOff, Cpu, Home, Users, TrendingUp, Lock } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_COLORS, type ThreadCategory } from '@/lib/forumStore';
import { Badge } from '@/components/ui/badge';

const categories: ThreadCategory[] = ['zero-knowledge', 'cryptography', 'identity', 'privacy-tech', 'decentralized', 'general'];

const privacyTools = [
  { icon: Lock, label: 'E2E Encryption', path: '/tools/encrypt', color: 'oklch(0.7 0.17 162)' },
  { icon: EyeOff, label: 'Steganography', path: '/tools/stego', color: 'oklch(0.51 0.24 264)' },
  { icon: Cpu, label: 'Homomorphic', path: '/tools/he', color: 'oklch(0.75 0.18 75)' },
  { icon: Database, label: 'IPFS Storage', path: '/tools/ipfs', color: 'oklch(0.51 0.24 264)' },
  { icon: BarChart2, label: 'Diff. Privacy', path: '/tools/dp', color: 'oklch(0.75 0.18 75)' },
  { icon: Zap, label: 'ZKP Proof', path: '/tools/zkp', color: 'oklch(0.75 0.18 75)' },
];

interface ForumSidebarProps {
  activeCategory?: ThreadCategory | null;
  onCategorySelect?: (cat: ThreadCategory | null) => void;
  onToolSelect?: (tool: string) => void;
  activeView: 'forum' | 'tools';
  onViewChange: (view: 'forum' | 'tools') => void;
}

export default function ForumSidebar({
  activeCategory,
  onCategorySelect,
  onToolSelect,
  activeView,
  onViewChange,
}: ForumSidebarProps) {
  return (
    <aside className="w-56 shrink-0 flex flex-col gap-4 sticky top-0 h-screen pt-4 pb-8 overflow-y-auto">
      {/* Logo */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.51_0.24_264/0.2)] border border-[oklch(0.51_0.24_264/0.4)] flex items-center justify-center">
            <Shield className="w-4 h-4 text-[oklch(0.51_0.24_264)]" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Zero<span className="text-[oklch(0.51_0.24_264)]">Forum</span>
            </span>
            <p className="text-[9px] text-muted-foreground leading-none">Anonymous · Encrypted · Decentralized</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="space-y-0.5 px-2">
        <button
          onClick={() => onViewChange('forum')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
            activeView === 'forum'
              ? 'bg-[oklch(0.51_0.24_264/0.15)] text-foreground border border-[oklch(0.51_0.24_264/0.3)]'
              : 'text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Forum</span>
        </button>
        <button
          onClick={() => onViewChange('forum')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)] transition-all duration-150"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Trending</span>
        </button>
        <button
          onClick={() => onViewChange('forum')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)] transition-all duration-150"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members</span>
        </button>
      </nav>

      {/* Divider */}
      <div className="px-3">
        <div className="h-px bg-border" />
      </div>

      {/* Categories */}
      <div className="px-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-1.5">Categories</p>
        <div className="space-y-0.5">
          <button
            onClick={() => { onCategorySelect?.(null); onViewChange('forum'); }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 ${
              activeView === 'forum' && !activeCategory
                ? 'bg-[oklch(1_0_0/0.08)] text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]'
            }`}
          >
            <Hash className="w-3 h-3" />
            <span>All Posts</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { onCategorySelect?.(cat); onViewChange('forum'); }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                activeView === 'forum' && activeCategory === cat
                  ? 'bg-[oklch(1_0_0/0.08)] text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: CATEGORY_COLORS[cat] }}
              />
              <span>{CATEGORY_LABELS[cat]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="px-3">
        <div className="h-px bg-border" />
      </div>

      {/* Privacy Tools */}
      <div className="px-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-1.5">Privacy Tools</p>
        <div className="space-y-0.5">
          {privacyTools.map(tool => (
            <button
              key={tool.path}
              onClick={() => { onToolSelect?.(tool.path); onViewChange('tools'); }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                activeView === 'tools'
                  ? 'text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]'
              }`}
            >
              <tool.icon className="w-3 h-3 shrink-0" style={{ color: tool.color }} />
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom: privacy note */}
      <div className="mt-auto px-3">
        <div className="p-2.5 rounded-lg bg-[oklch(0.7_0.17_162/0.08)] border border-[oklch(0.7_0.17_162/0.2)]">
          <p className="text-[9px] text-[oklch(0.7_0.17_162)] leading-relaxed">
            All posts are end-to-end encrypted. The server never sees plaintext. Your identity is a ZKP nullifier.
          </p>
        </div>
      </div>
    </aside>
  );
}
