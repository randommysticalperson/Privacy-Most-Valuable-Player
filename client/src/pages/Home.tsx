/**
 * Home.tsx — ZeroForum Main Page
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Layout: Left sidebar + main content area (forum or tools panel)
 * Auth: MetaMask Embedded Wallets SDK (@web3auth/modal/react)
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ForumSidebar from "@/components/forum/ForumSidebar";
import ForumHeader from "@/components/forum/ForumHeader";
import ThreadList from "@/components/forum/ThreadList";
import ThreadView from "@/components/forum/ThreadView";
import NewThreadModal from "@/components/forum/NewThreadModal";
import E2EEncryptPanel from "@/components/E2EEncryptPanel";
import IPFSStoragePanel from "@/components/IPFSStoragePanel";
import DPAnalyticsPanel from "@/components/DPAnalyticsPanel";
import SteganographyPanel from "@/components/SteganographyPanel";
import HomomorphicPanel from "@/components/HomomorphicPanel";
import ZKPProofPanel from "@/components/ZKPProofPanel";
import { type ForumThread, type ForumPost, type ThreadCategory } from "@/lib/forumStore";

type ToolView = '/tools/encrypt' | '/tools/stego' | '/tools/he' | '/tools/ipfs' | '/tools/dp' | '/tools/zkp';

export default function Home() {
  const [activeView, setActiveView] = useState<'forum' | 'tools'>('forum');
  const [activeCategory, setActiveCategory] = useState<ThreadCategory | null>(null);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [activeTool, setActiveTool] = useState<ToolView>('/tools/encrypt');
  const [showNewThread, setShowNewThread] = useState(false);
  const [extraThreads, setExtraThreads] = useState<ForumThread[]>([]);
  const [extraPosts, setExtraPosts] = useState<ForumPost[]>([]);

  const handleToolSelect = (tool: string) => {
    setActiveTool(tool as ToolView);
    setActiveView('tools');
  };

  const handleThreadCreated = (thread: ForumThread) => {
    setExtraThreads(prev => [thread, ...prev]);
    setSelectedThread(thread);
    setActiveView('forum');
  };

  const handlePostAdded = (post: ForumPost) => {
    setExtraPosts(prev => [...prev, post]);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.01_265)] text-foreground flex flex-col">
      {/* Top header */}
      <ForumHeader onNewThread={() => setShowNewThread(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — hidden on mobile */}
        <div className="hidden lg:block border-r border-border bg-[oklch(0.09_0.01_265/0.8)]">
          <ForumSidebar
            activeCategory={activeCategory}
            onCategorySelect={cat => {
              setActiveCategory(cat);
              setSelectedThread(null);
            }}
            onToolSelect={handleToolSelect}
            activeView={activeView}
            onViewChange={setActiveView}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <AnimatePresence mode="wait">
              {activeView === 'forum' ? (
                <motion.div
                  key="forum"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                >
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
                      onThreadSelect={setSelectedThread}
                      extraThreads={extraThreads}
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="tools"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <ToolsView activeTool={activeTool} onToolChange={t => setActiveTool(t as ToolView)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Right panel — tech stack info */}
        <div className="hidden xl:block w-56 border-l border-border bg-[oklch(0.09_0.01_265/0.8)] p-4 space-y-4 overflow-y-auto">
          <RightPanel />
        </div>
      </div>

      {/* New thread modal */}
      <NewThreadModal
        open={showNewThread}
        onClose={() => setShowNewThread(false)}
        onCreated={handleThreadCreated}
      />
    </div>
  );
}

// Tools panel switcher
const TOOL_TABS: { path: ToolView; label: string }[] = [
  { path: '/tools/encrypt', label: 'E2E Encrypt' },
  { path: '/tools/stego', label: 'Steganography' },
  { path: '/tools/he', label: 'Homomorphic' },
  { path: '/tools/ipfs', label: 'IPFS Storage' },
  { path: '/tools/dp', label: 'Diff. Privacy' },
  { path: '/tools/zkp', label: 'ZKP Proof' },
];

function ToolsView({ activeTool, onToolChange }: { activeTool: ToolView; onToolChange: (t: string) => void }) {
  return (
    <div className="space-y-4">
      {/* Tool tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {TOOL_TABS.map(tab => (
          <button
            key={tab.path}
            onClick={() => onToolChange(tab.path)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-150 ${
              activeTool === tab.path
                ? 'bg-[oklch(0.51_0.24_264/0.15)] text-[oklch(0.51_0.24_264)] border border-[oklch(0.51_0.24_264/0.3)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)]'
            }`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tool content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTool}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {activeTool === '/tools/encrypt' && <E2EEncryptPanel />}
          {activeTool === '/tools/stego' && <SteganographyPanel />}
          {activeTool === '/tools/he' && <HomomorphicPanel />}
          {activeTool === '/tools/ipfs' && <IPFSStoragePanel />}
          {activeTool === '/tools/dp' && <DPAnalyticsPanel />}
          {activeTool === '/tools/zkp' && <ZKPProofPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Right sidebar panel — tech stack + live stats
function RightPanel() {
  const techStack = [
    { name: '@web3auth/modal', desc: 'MetaMask Embedded SDK', color: 'oklch(0.75 0.18 75)' },
    { name: 'Semaphore V4', desc: 'ZKP group proof', color: 'oklch(0.51 0.24 264)' },
    { name: 'WebCrypto API', desc: 'AES-GCM-256 E2E', color: 'oklch(0.7 0.17 162)' },
    { name: 'IPFS / Pinata', desc: 'Decentralized storage', color: 'oklch(0.51 0.24 264)' },
    { name: 'DID:PKH', desc: 'W3C Decentralized ID', color: 'oklch(0.7 0.17 162)' },
    { name: 'Laplace DP', desc: 'Differential privacy', color: 'oklch(0.75 0.18 75)' },
    { name: 'LSB Stego', desc: 'Image steganography', color: 'oklch(0.51 0.24 264)' },
    { name: 'BFV Scheme', desc: 'Homomorphic encryption', color: 'oklch(0.75 0.18 75)' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Tech Stack</p>
        <div className="space-y-2">
          {techStack.map(t => (
            <div key={t.name} className="space-y-0.5">
              <p className="text-[11px] font-mono" style={{ color: t.color }}>{t.name}</p>
              <p className="text-[10px] text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Privacy Guarantees</p>
        <div className="space-y-1.5">
          {[
            'No passwords stored',
            'Server sees only ciphertext',
            'Identity = ZKP nullifier',
            'Metadata minimized',
            'IPFS content-addressed',
            'Analytics noise-injected',
          ].map(g => (
            <div key={g} className="flex items-start gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[oklch(0.7_0.17_162)] mt-1.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground">{g}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="p-2.5 rounded-lg bg-[oklch(0.51_0.24_264/0.08)] border border-[oklch(0.51_0.24_264/0.2)]">
        <p className="text-[9px] text-[oklch(0.51_0.24_264)] leading-relaxed">
          This is a privacy MVP demo. All cryptographic operations run in your browser. No data is sent to any server.
        </p>
      </div>
    </div>
  );
}
