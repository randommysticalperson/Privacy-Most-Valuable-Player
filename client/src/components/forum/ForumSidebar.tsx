/**
 * ForumSidebar — Left navigation sidebar for ZeroForum
 */

import { Home, TrendingUp, Users, Lock, Eye, Cpu, Database, BarChart2, Zap, Shield } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_COLORS, type ThreadCategory } from "@/lib/forumStore";

const CATEGORIES: ThreadCategory[] = ["zero-knowledge","cryptography","identity","privacy-tech","decentralized","general"];

const PRIVACY_TOOLS = [
  { path: "/tools/encrypt", label: "E2E 加密", icon: Lock },
  { path: "/tools/stego",   label: "隱寫術",  icon: Eye },
  { path: "/tools/he",      label: "同態加密",    icon: Cpu },
  { path: "/tools/ipfs",    label: "IPFS 儲存",   icon: Database },
  { path: "/tools/dp",      label: "差分隱私",  icon: BarChart2 },
  { path: "/tools/zkp",     label: "ZKP 證明",      icon: Zap },
];

interface ForumSidebarProps {
  activeCategory: ThreadCategory | null;
  onCategorySelect: (cat: ThreadCategory | null) => void;
  onToolSelect: (tool: string) => void;
  activeView: "forum" | "tools";
  onViewChange: (v: "forum" | "tools") => void;
}

export default function ForumSidebar({
  activeCategory, onCategorySelect, onToolSelect, activeView, onViewChange,
}: ForumSidebarProps) {
  return (
    <div className="w-44 h-full flex flex-col py-3 px-2 overflow-y-auto">
      {/* Brand */}
      <div className="px-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[oklch(0.51_0.24_264/0.2)] border border-[oklch(0.51_0.24_264/0.4)] flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-[oklch(0.51_0.24_264)]" />
          </div>
          <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="text-[oklch(0.51_0.24_264)]">Zero</span>
            <span className="text-foreground">Forum</span>
          </span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
          匿名 · 加密 · 去中心化
        </p>
      </div>

      {/* Top nav */}
      <div className="space-y-0.5 mb-3">
        {[
          { label: "論壇", icon: Home, view: "forum" as const },
          { label: "熱門", icon: TrendingUp, view: "forum" as const },
          { label: "成員", icon: Users, view: "forum" as const },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => { onViewChange(item.view); onCategorySelect(null); }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
              activeView === "forum" && !activeCategory && item.label === "論壇"
                ? "bg-[oklch(0.51_0.24_264/0.12)] text-[oklch(0.51_0.24_264)]"
                : "text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]"
            }`}
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      {/* 分類 */}
      <div className="mb-3">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground px-2 mb-1.5">分類</p>
        <div className="space-y-0.5">
          <button
            onClick={() => { onViewChange("forum"); onCategorySelect(null); }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
              activeView === "forum" && !activeCategory
                ? "bg-[oklch(0.51_0.24_264/0.12)] text-[oklch(0.51_0.24_264)]"
                : "text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            全部討論
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { onViewChange("forum"); onCategorySelect(cat); }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                activeView === "forum" && activeCategory === cat
                  ? "bg-[oklch(0.51_0.24_264/0.12)] text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[cat] }} />
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy tools */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground px-2 mb-1.5">隱私工具</p>
        <div className="space-y-0.5">
          {PRIVACY_TOOLS.map(tool => (
            <button
              key={tool.path}
              onClick={() => onToolSelect(tool.path)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                activeView === "tools"
                  ? "text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]"
              }`}
            >
              <tool.icon className="w-3.5 h-3.5" />
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-3 px-2">
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          所有帖子皆經端對端加密。身份 = ZKP 無效化符。
        </p>
      </div>
    </div>
  );
}
