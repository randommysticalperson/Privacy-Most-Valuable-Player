/**
 * About.tsx — ZeroForum About Page
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * Shows project mission, tech stack, and GitHub repository link
 */

import { useI18n } from "@/contexts/I18nContext";
import { ExternalLink, Github, Shield, Lock, Zap, Database, Eye, BarChart2, Cpu } from "lucide-react";
import { motion } from "framer-motion";

const GITHUB_URL = "https://github.com/randommysticalperson/Privacy-Most-Valuable-Player";

const TECH_STACK = [
  { icon: Shield,    label: "Semaphore ZKP",       desc: "Anonymous identity & group membership proofs" },
  { icon: Lock,      label: "WebCrypto E2E",        desc: "AES-GCM end-to-end encryption in the browser" },
  { icon: Zap,       label: "MetaMask / Burner",    desc: "EIP-1193 wallet + ephemeral in-browser keypair" },
  { icon: Database,  label: "IPFS Storage",         desc: "Decentralised content-addressed file storage" },
  { icon: BarChart2, label: "Differential Privacy", desc: "Laplace-noise analytics without user profiling" },
  { icon: Eye,       label: "LSB Steganography",    desc: "Hide messages inside image pixel channels" },
  { icon: Cpu,       label: "Homomorphic Enc.",     desc: "Compute on encrypted data without decrypting" },
];

interface Props {
  onBack: () => void;
}

export default function About({ onBack }: Props) {
  const { lang } = useI18n();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← {lang === "zh" ? "返回論壇" : "Back to Forum"}
      </button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.51_0.24_264/0.15)] border border-[oklch(0.51_0.24_264/0.4)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[oklch(0.51_0.24_264)]" />
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span className="text-[oklch(0.51_0.24_264)]">Zero</span>
              <span className="text-foreground">Forum</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              {lang === "zh" ? "匿名・去中心化・隱私優先" : "Anonymous · Decentralised · Privacy-First"}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {lang === "zh"
            ? "ZeroForum 是一個以隱私為核心的去中心化論壇，由 MetaMask、Semaphore ZKP、WebCrypto E2E 和 IPFS 驅動。連接錢包即可發言——你的身份是 ZKP 無效化符，而非使用者名稱。所有帖子均以端對端加密儲存，分析資料加入差分隱私雜訊，確保個人資料永不暴露。"
            : "ZeroForum is a privacy-first decentralised forum powered by MetaMask, Semaphore ZKP, WebCrypto E2E encryption, and IPFS. Connect a wallet to post — your identity is a ZKP nullifier, not a username. All posts are stored with end-to-end encryption, and analytics data is protected with differential privacy noise so no individual can ever be identified."}
        </p>

        {/* GitHub link */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[oklch(0.51_0.24_264/0.1)] border border-[oklch(0.51_0.24_264/0.35)] text-[oklch(0.7_0.15_264)] hover:bg-[oklch(0.51_0.24_264/0.2)] hover:border-[oklch(0.51_0.24_264/0.6)] transition-all text-sm font-medium"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <Github className="w-4 h-4" />
          {lang === "zh" ? "在 GitHub 上查看原始碼" : "View Source on GitHub"}
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </motion.div>

      {/* Tech stack */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 space-y-4"
      >
        <h2
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {lang === "zh" ? "隱私技術棧" : "Privacy Tech Stack"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TECH_STACK.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-3 p-3 rounded-lg bg-[oklch(1_0_0/0.03)] border border-[oklch(1_0_0/0.07)] hover:bg-[oklch(1_0_0/0.05)] transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-[oklch(0.51_0.24_264/0.1)] border border-[oklch(0.51_0.24_264/0.25)] flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-[oklch(0.51_0.24_264)]" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {label}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Principles */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-6 space-y-3"
      >
        <h2
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {lang === "zh" ? "設計原則" : "Design Principles"}
        </h2>
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          {(lang === "zh" ? [
            "無帳號密碼——身份由錢包或 ZKP 承諾值決定",
            "伺服器僅儲存密文——明文永不上傳",
            "差分隱私雜訊保護統計資料——無法識別個人",
            "燃燒錢包——無需安裝任何擴充套件即可匿名參與",
            "開源——所有程式碼公開透明，可自行審計",
          ] : [
            "No passwords — identity is determined by wallet or ZKP commitment",
            "Server stores only ciphertexts — plaintext never leaves your device",
            "Differential privacy noise protects analytics — individuals cannot be identified",
            "Burner wallet — participate anonymously without installing any extension",
            "Open source — all code is public and auditable",
          ]).map((principle, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[oklch(0.51_0.24_264)] mt-0.5 shrink-0">▸</span>
              <span>{principle}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground/50 pb-4">
        {lang === "zh" ? "以開源精神建構，為隱私而生。" : "Built with open-source spirit, for privacy."}
        {" · "}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground transition-colors underline underline-offset-2"
        >
          GitHub
        </a>
      </div>
    </div>
  );
}
