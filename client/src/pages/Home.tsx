/**
 * Home.tsx — Main Application Page
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Layout:
 * - Full-width hero section with background image
 * - 2-column dashboard: left (wallet + ZKP), right (E2E + IPFS + DP)
 * - Architecture overview section
 * - Footer with tech stack
 */

import WalletAuthPanel from "@/components/WalletAuthPanel";
import ZKPProofPanel from "@/components/ZKPProofPanel";
import E2EEncryptPanel from "@/components/E2EEncryptPanel";
import IPFSStoragePanel from "@/components/IPFSStoragePanel";
import DPAnalyticsPanel from "@/components/DPAnalyticsPanel";
import { motion } from "framer-motion";
import { Shield, Lock, Database, BarChart2, Zap, ExternalLink } from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663332318761/Lc9psW6cNr5xUfrXrGkTUX/hero-bg-ZJayaXRxyCQiW3V7DUYdu6.webp";
const ZKP_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663332318761/Lc9psW6cNr5xUfrXrGkTUX/zkp-visual-hhZ9oGLX3SWffqvs9kfjBA.webp";
const ENC_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663332318761/Lc9psW6cNr5xUfrXrGkTUX/encryption-visual-ZudeejdonVfSu465YRBgmb.webp";

const techStack = [
  { name: 'Semaphore V4', desc: 'ZKP group membership', href: 'https://semaphore.pse.dev', color: 'oklch(0.51 0.24 264)' },
  { name: 'SIWE', desc: 'Sign-In with Ethereum', href: 'https://login.xyz', color: 'oklch(0.7 0.17 162)' },
  { name: 'WebCrypto API', desc: 'AES-GCM-256 E2E', href: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API', color: 'oklch(0.75 0.18 75)' },
  { name: 'IPFS / Pinata', desc: 'Decentralized storage', href: 'https://pinata.cloud', color: 'oklch(0.51 0.24 264)' },
  { name: 'DID:PKH', desc: 'W3C Decentralized ID', href: 'https://www.w3.org/TR/did-core/', color: 'oklch(0.7 0.17 162)' },
  { name: 'Laplace DP', desc: 'Differential privacy', href: 'https://opendp.org', color: 'oklch(0.75 0.18 75)' },
];

const architectureItems = [
  {
    icon: Shield,
    title: 'No Username / Password',
    desc: 'Authentication via cryptographic wallet signature (SIWE). Identity = key pair. DID:PKH derives a W3C-standard identifier from your Ethereum address.',
    color: 'oklch(0.51 0.24 264)',
  },
  {
    icon: Zap,
    title: 'Zero-Knowledge Proof',
    desc: 'Semaphore V4 proves group membership without revealing which member you are. The nullifier prevents double-signaling without linking to identity.',
    color: 'oklch(0.75 0.18 75)',
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    desc: 'All data is encrypted in the browser using AES-GCM-256 before leaving the client. The server stores only ciphertext — it cannot read your data.',
    color: 'oklch(0.7 0.17 162)',
  },
  {
    icon: Database,
    title: 'Decentralized Storage',
    desc: 'Encrypted ciphertext is pinned to IPFS. The CID (content hash) is stored server-side. Personal data never goes on-chain — blockchain data is immutable.',
    color: 'oklch(0.51 0.24 264)',
  },
  {
    icon: BarChart2,
    title: 'Differential Privacy',
    desc: 'Analytics use the Laplace mechanism to add calibrated noise. Individual users cannot be identified from aggregate statistics even with auxiliary data.',
    color: 'oklch(0.75 0.18 75)',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen hex-bg">
      {/* Hero Section */}
      <section
        className="relative min-h-[60vh] flex flex-col items-start justify-end pb-16 px-6 md:px-12 lg:px-20 overflow-hidden"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.09_0.02_265)] via-[oklch(0.09_0.02_265/0.7)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.09_0.02_265/0.6)] to-transparent" />

        {/* Content */}
        <div className="relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="px-3 py-1 rounded-full border border-[oklch(0.51_0.24_264/0.4)] bg-[oklch(0.51_0.24_264/0.1)] text-[oklch(0.51_0.24_264)] text-xs font-medium"
                   style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Privacy-First Architecture MVP
              </div>
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Identity Without
              <br />
              <span className="text-transparent bg-clip-text"
                    style={{ backgroundImage: 'linear-gradient(90deg, oklch(0.51 0.24 264), oklch(0.7 0.17 162))' }}>
                Passwords
              </span>
            </h1>
            <p className="text-base md:text-lg text-[oklch(0.8_0.005_265)] max-w-xl leading-relaxed">
              Wallet authentication · Zero-knowledge proofs · End-to-end encryption · Decentralized storage · Differential privacy analytics
            </p>
          </motion.div>

          {/* Tech badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-wrap gap-2 mt-6"
          >
            {['DID:PKH', 'Semaphore ZKP', 'AES-GCM', 'IPFS', 'Laplace DP'].map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-md text-xs font-mono bg-[oklch(0.14_0.015_265/0.7)] border border-[oklch(1_0_0/0.1)] text-[oklch(0.8_0.005_265)]"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Dashboard */}
      <section className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <WalletAuthPanel />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ZKPProofPanel />
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <E2EEncryptPanel />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <IPFSStoragePanel />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <DPAnalyticsPanel />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="container py-12 border-t border-border">
        <div className="flex items-start gap-12">
          {/* Left: text */}
          <div className="flex-1 space-y-8">
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold mb-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Privacy Architecture
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                Each layer of this system is designed to minimize trust in any central party. The server never sees plaintext data, never stores passwords, and cannot link actions to real identities.
              </p>
            </div>

            <div className="space-y-4">
              {architectureItems.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 p-4 glass-panel glass-panel-hover"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      borderColor: item.color,
                      background: `color-mix(in oklch, ${item.color} 15%, transparent)`,
                      color: item.color,
                    }}
                  >
                    <item.icon className="w-4.5 h-4.5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: images */}
          <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
            <div className="rounded-xl overflow-hidden border border-border animate-float">
              <img src={ZKP_IMG} alt="ZKP Visualization" className="w-full object-cover" />
              <div className="p-2 bg-[oklch(0.14_0.015_265/0.8)] text-center">
                <p className="text-[10px] text-muted-foreground">Semaphore ZKP Circuit</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-border" style={{ animationDelay: '2s' }}>
              <img src={ENC_IMG} alt="E2E Encryption" className="w-full object-cover" />
              <div className="p-2 bg-[oklch(0.14_0.015_265/0.8)] text-center">
                <p className="text-[10px] text-muted-foreground">End-to-End Encryption Flow</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container py-10 border-t border-border">
        <h3
          className="text-sm font-semibold text-muted-foreground mb-5 uppercase tracking-wider"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Technology Stack
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {techStack.map(tech => (
            <a
              key={tech.name}
              href={tech.href}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel glass-panel-hover p-3 text-center group"
            >
              <p
                className="text-sm font-semibold mb-0.5 group-hover:underline"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: tech.color }}
              >
                {tech.name}
              </p>
              <p className="text-[10px] text-muted-foreground">{tech.desc}</p>
              <ExternalLink className="w-2.5 h-2.5 text-muted-foreground mx-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-6 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[oklch(0.51_0.24_264/0.2)] border border-[oklch(0.51_0.24_264/0.3)] flex items-center justify-center">
              <Shield className="w-3 h-3 text-[oklch(0.51_0.24_264)]" />
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Privacy-First Identity MVP</span>
          </div>
          <p>No passwords · No tracking · No central authority</p>
          <p className="font-mono text-[10px]">Built with React + WebCrypto + Semaphore V4</p>
        </div>
      </footer>
    </div>
  );
}
