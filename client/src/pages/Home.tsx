/**
 * Home.tsx — ZeroForum main page
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * Layout: Three-column forum (sidebar | thread list | tools panel)
 * i18n: 繁體中文 / English via I18nContext
 */

import { useState } from "react";
import ForumHeader from "@/components/forum/ForumHeader";
import ForumSidebar from "@/components/forum/ForumSidebar";
import ThreadList from "@/components/forum/ThreadList";
import ThreadView from "@/components/forum/ThreadView";
import NewThreadModal from "@/components/forum/NewThreadModal";
import MobileBottomNav from "@/components/forum/MobileBottomNav";
import WalletAuthPanel from "@/components/WalletAuthPanel";
import ZKPProofPanel from "@/components/ZKPProofPanel";
import E2EEncryptPanel from "@/components/E2EEncryptPanel";
import IPFSStoragePanel from "@/components/IPFSStoragePanel";
import DPAnalyticsPanel from "@/components/DPAnalyticsPanel";
import SteganographyPanel from "@/components/SteganographyPanel";
import HomomorphicPanel from "@/components/HomomorphicPanel";
import { type ForumThread, type ForumPost, type ThreadCategory } from "@/lib/forumStore";
import { I18nProvider, useI18n } from "@/contexts/I18nContext";

type ActiveTool = "wallet" | "zkp" | "encrypt" | "ipfs" | "dp" | "stego" | "he";
type ActiveView = "forum" | "tools" | "wallet";

function ForumApp() {
  const { t, lang } = useI18n();

  const TOOL_LABELS: Record<ActiveTool, string> = {
    wallet: t("toolLabelWallet"),
    zkp: t("toolLabelZKP"),
    encrypt: t("toolLabelEncrypt"),
    ipfs: t("toolLabelIPFS"),
    dp: t("toolLabelDP"),
    stego: t("toolLabelStego"),
    he: t("toolLabelHE"),
  };

  const [activeCategory, setActiveCategory] = useState<ThreadCategory | null>(null);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("forum");
  const [activeTool, setActiveTool] = useState<ActiveTool>("wallet");
  const [extraThreads, setExtraThreads] = useState<ForumThread[]>([]);
  const [extraPosts, setExtraPosts] = useState<ForumPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleToolSelect = (path: string) => {
    const toolMap: Record<string, ActiveTool> = {
      "/tools/encrypt": "encrypt",
      "/tools/stego": "stego",
      "/tools/he": "he",
      "/tools/ipfs": "ipfs",
      "/tools/dp": "dp",
      "/tools/zkp": "zkp",
    };
    const tool = toolMap[path];
    if (tool) {
      setActiveTool(tool);
      setActiveView("tools");
    }
  };

  const handleThreadCreated = (thread: ForumThread) => {
    setExtraThreads(prev => [thread, ...prev]);
    setSelectedThread(thread);
    setActiveView("forum");
  };

  const handlePostAdded = (post: ForumPost) => {
    setExtraPosts(prev => [...prev, post]);
  };

  const handleMobileViewChange = (view: ActiveView) => {
    setActiveView(view);
    if (view === "forum") setSelectedThread(null);
    if (view === "tools" && activeTool === "wallet") setActiveTool("zkp");
  };

  const renderToolPanel = () => {
    switch (activeTool) {
      case "wallet":   return <WalletAuthPanel />;
      case "zkp":      return <ZKPProofPanel />;
      case "encrypt":  return <E2EEncryptPanel />;
      case "ipfs":     return <IPFSStoragePanel />;
      case "dp":       return <DPAnalyticsPanel />;
      case "stego":    return <SteganographyPanel />;
      case "he":       return <HomomorphicPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top header bar */}
      <ForumHeader
        onNewThread={() => setShowNewThread(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — desktop only */}
        <aside className="hidden md:flex flex-col border-r border-border bg-[oklch(0.09_0.01_265/0.8)] w-44 shrink-0">
          <ForumSidebar
            activeCategory={activeCategory}
            onCategorySelect={cat => {
              setActiveCategory(cat);
              setSelectedThread(null);
              setActiveView("forum");
            }}
            onToolSelect={handleToolSelect}
            activeView={activeView === "wallet" ? "tools" : activeView}
            onViewChange={v => {
              setActiveView(v);
              if (v === "forum") setSelectedThread(null);
            }}
          />
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {/* FORUM VIEW */}
          {activeView === "forum" && (
            <div className="max-w-2xl mx-auto px-4 py-5">
              {selectedThread ? (
                <ThreadView
                  thread={selectedThread}
                  onBack={() => setSelectedThread(null)}
                  extraPosts={extraPosts}
                  onPostAdded={handlePostAdded}
                />
              ) : (
                <ThreadList
                  activeCategory={activeCategory}
                  onThreadSelect={t => setSelectedThread(t)}
                  extraThreads={extraThreads}
                  searchQuery={searchQuery}
                />
              )}
            </div>
          )}

          {/* TOOLS VIEW */}
          {activeView === "tools" && (
            <div className="max-w-xl mx-auto px-4 py-5 space-y-4">
              {/* Tool selector tabs */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TOOL_LABELS) as ActiveTool[]).filter(k => k !== "wallet").map(tool => (
                  <button
                    key={tool}
                    onClick={() => setActiveTool(tool)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors border ${
                      activeTool === tool
                        ? "bg-[oklch(0.51_0.24_264/0.15)] border-[oklch(0.51_0.24_264/0.4)] text-[oklch(0.51_0.24_264)]"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]"
                    }`}
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {TOOL_LABELS[tool]}
                  </button>
                ))}
              </div>
              {activeTool === "wallet" ? <WalletAuthPanel /> : renderToolPanel()}
            </div>
          )}

          {/* WALLET VIEW — mobile only */}
          {activeView === "wallet" && (
            <div className="max-w-sm mx-auto px-4 py-5">
              <WalletAuthPanel />
            </div>
          )}
        </main>

        {/* Right panel — desktop only */}
        <aside className="hidden lg:flex flex-col border-l border-border bg-[oklch(0.09_0.01_265/0.8)] w-72 shrink-0 overflow-y-auto p-3 space-y-3">
          <WalletAuthPanel />
          <div className="border-t border-border pt-3">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground px-1 mb-2">
              {t("privacyTools")}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {(["zkp", "encrypt", "ipfs", "dp", "stego", "he"] as ActiveTool[]).map(tool => (
                <button
                  key={tool}
                  onClick={() => { setActiveTool(tool); setActiveView("tools"); }}
                  className={`px-2 py-1.5 rounded-lg text-[10px] text-left border transition-colors ${
                    activeView === "tools" && activeTool === tool
                      ? "bg-[oklch(0.51_0.24_264/0.12)] border-[oklch(0.51_0.24_264/0.3)] text-[oklch(0.51_0.24_264)]"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]"
                  }`}
                >
                  {TOOL_LABELS[tool]}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav
        activeView={activeView === "tools" ? "tools" : activeView === "wallet" ? "wallet" : "forum"}
        onViewChange={handleMobileViewChange}
      />

      {/* New thread modal */}
      <NewThreadModal
        open={showNewThread}
        onClose={() => setShowNewThread(false)}
        onCreated={handleThreadCreated}
      />
    </div>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <ForumApp />
    </I18nProvider>
  );
}
