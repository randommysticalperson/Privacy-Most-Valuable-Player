/**
 * ForumSidebar — Left navigation sidebar for ZeroForum
 * i18n: all labels via useI18n()
 */

import { Home, TrendingUp, Users, Lock, Eye, Cpu, Database, BarChart2, Zap, Shield, FileText, Info } from "lucide-react";
import { CATEGORY_COLORS, type ThreadCategory } from "@/lib/forumStore";
import { useI18n } from "@/contexts/I18nContext";

const CATEGORIES: ThreadCategory[] = ["zero-knowledge","cryptography","identity","privacy-tech","decentralized","general"];

interface ForumSidebarProps {
  activeCategory: ThreadCategory | null;
  onCategorySelect: (cat: ThreadCategory | null) => void;
  onToolSelect: (tool: string) => void;
  activeView: "forum" | "tools" | "contracts" | "about";
  onViewChange: (v: "forum" | "tools" | "contracts" | "about") => void;
}

export default function ForumSidebar({
  activeCategory, onCategorySelect, onToolSelect, activeView, onViewChange,
}: ForumSidebarProps) {
  const { t, lang } = useI18n();

  const CATEGORY_LABELS_I18N: Record<ThreadCategory, string> = {
    "zero-knowledge": t("catZkp"),
    "cryptography":   t("catCrypto"),
    "identity":       t("catIdentity"),
    "privacy-tech":   t("catPrivacy"),
    "decentralized":  t("catDecentralized"),
    "general":        t("catGeneral"),
  };

  const PRIVACY_TOOLS = [
    { path: "/tools/encrypt", label: t("toolE2E"),   icon: Lock },
    { path: "/tools/stego",   label: t("toolStego"), icon: Eye },
    { path: "/tools/he",      label: t("toolHE"),    icon: Cpu },
    { path: "/tools/ipfs",    label: t("toolIPFS"),  icon: Database },
    { path: "/tools/dp",      label: t("toolDP"),    icon: BarChart2 },
    { path: "/tools/zkp",     label: t("toolZKP"),   icon: Zap },
  ];

  const TOP_NAV = [
    { labelKey: "forum" as const,    icon: Home,       view: "forum" as const },
    { labelKey: "trending" as const, icon: TrendingUp, view: "forum" as const },
    { labelKey: "members" as const,  icon: Users,      view: "forum" as const },
  ];

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
          {t("appTagline")}
        </p>
      </div>

      {/* Top nav */}
      <div className="space-y-0.5 mb-3">
        {TOP_NAV.map(item => (
          <button
            key={item.labelKey}
            onClick={() => { onViewChange(item.view); onCategorySelect(null); }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
              activeView === "forum" && !activeCategory && item.labelKey === "forum"
                ? "bg-[oklch(0.51_0.24_264/0.12)] text-[oklch(0.51_0.24_264)]"
                : "text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]"
            }`}
          >
            <item.icon className="w-3.5 h-3.5" />
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="mb-3">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground px-2 mb-1.5">
          {t("sectionCategories")}
        </p>
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
            {t("catAll")}
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
              {CATEGORY_LABELS_I18N[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Contract Registry link */}
      <div className="mb-3">
        <button
          onClick={() => onViewChange("contracts")}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            activeView === "contracts"
              ? "bg-[oklch(0.51_0.24_264/0.12)] text-[oklch(0.51_0.24_264)]"
              : "text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          {t("contractRegistry")}
        </button>
      </div>

      {/* Privacy tools */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground px-2 mb-1.5">
          {t("sectionTools")}
        </p>
        <div className="space-y-0.5">
          {PRIVACY_TOOLS.map(tool => (
            <button
              key={tool.path}
              onClick={() => onToolSelect(tool.path)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]"
            >
              <tool.icon className="w-3.5 h-3.5" />
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-3 px-2 space-y-1.5">
        {/* About link */}
        <button
          onClick={() => onViewChange("about")}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
            activeView === "about"
              ? "bg-[oklch(0.51_0.24_264/0.12)] text-[oklch(0.51_0.24_264)]"
              : "text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]"
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          {lang === "zh" ? "關於" : "About"}
        </button>
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          {t("appTagline")}
        </p>
      </div>
    </div>
  );
}
