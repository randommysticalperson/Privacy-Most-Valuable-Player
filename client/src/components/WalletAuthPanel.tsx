/**
 * WalletAuthPanel — DID/Wallet Authentication UI
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * Trust colors: grey (disconnected) → amber (connecting) → emerald (connected)
 */

import { useWallet } from "@/contexts/WalletContext";
import { useSemaphore } from "@/contexts/SemaphoreContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Shield, CheckCircle2, AlertCircle, Loader2, LogOut, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function WalletAuthPanel() {
  const { isConnected, isConnecting, address, userInfo, hasProvider, connect, disconnect } = useWallet();
  const { createIdentityFromWallet, identityInfo, status: zkpStatus } = useSemaphore();

  // Auto-create Semaphore identity when wallet connects
  useEffect(() => {
    if (isConnected && address && !identityInfo && zkpStatus === 'idle') {
      createIdentityFromWallet(address);
    }
  }, [isConnected, address, identityInfo, zkpStatus, createIdentityFromWallet]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const statusLabel = isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Not Connected';
  const statusColor = isConnecting
    ? 'text-[oklch(0.75_0.18_75)]'
    : isConnected
    ? 'text-[oklch(0.7_0.17_162)]'
    : 'text-[oklch(0.6_0.01_265)]';
  const statusBorder = isConnecting
    ? 'border-[oklch(0.75_0.18_75/0.4)]'
    : isConnected
    ? 'border-[oklch(0.7_0.17_162/0.4)]'
    : 'border-[oklch(0.6_0.01_265/0.3)]';

  // Step indicators
  const steps = ['Connect', 'Verify', 'DID', 'ZKP Identity'];
  const stepDone = (i: number) =>
    (i === 0 && isConnected) ||
    (i === 1 && isConnected) ||
    (i === 2 && isConnected) ||
    (i === 3 && !!identityInfo);
  const stepActive = (i: number) =>
    (i === 0 && isConnecting) ||
    (i === 3 && zkpStatus === 'creating-identity');

  return (
    <div className="glass-panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${statusBorder} ${statusColor}`}>
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Wallet / DID Login
            </h3>
            <p className="text-xs text-muted-foreground">MetaMask · EIP-1193 · DID:PKH</p>
          </div>
        </div>
        <Badge variant="outline" className={`text-xs ${statusColor} ${statusBorder} border`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Step flow indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
              stepDone(i)
                ? 'bg-[oklch(0.7_0.17_162/0.2)] border-[oklch(0.7_0.17_162/0.5)] text-[oklch(0.7_0.17_162)]'
                : stepActive(i)
                ? 'bg-[oklch(0.75_0.18_75/0.2)] border-[oklch(0.75_0.18_75/0.5)] text-[oklch(0.75_0.18_75)]'
                : 'border-[oklch(1_0_0/0.1)] text-muted-foreground'
            }`}>
              {stepDone(i) ? '✓' : i + 1}
            </div>
            <span className={stepDone(i) ? 'text-[oklch(0.7_0.17_162)]' : ''}>{step}</span>
            {i < steps.length - 1 && <div className="w-4 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* No provider warning */}
      {!hasProvider && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[oklch(0.65_0.22_25/0.1)] border border-[oklch(0.65_0.22_25/0.3)]">
          <AlertCircle className="w-4 h-4 text-[oklch(0.65_0.22_25)] mt-0.5 shrink-0" />
          <p className="text-xs text-[oklch(0.65_0.22_25)]">
            No wallet detected. Install{' '}
            <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="underline">
              MetaMask
            </a>{' '}
            to continue.
          </p>
        </div>
      )}

      {/* Not connected state */}
      {!isConnected && !isConnecting && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            No username or password required. Connect your Ethereum wallet to authenticate.
            Your identity is derived from your key pair — no data is sent to any server.
          </p>
          <Button
            onClick={connect}
            className="w-full bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white font-medium"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Supports MetaMask, Brave Wallet, Coinbase Wallet, and any EIP-1193 provider
          </p>
        </div>
      )}

      {/* Connecting state */}
      {isConnecting && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="w-8 h-8 text-[oklch(0.75_0.18_75)] animate-spin" />
          <p className="text-sm text-[oklch(0.75_0.18_75)]">Requesting wallet access…</p>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Approve the connection request in your wallet extension.
          </p>
        </div>
      )}

      {/* Connected state */}
      <AnimatePresence>
        {isConnected && address && userInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Address */}
            <div className="p-3 rounded-lg bg-[oklch(0.7_0.17_162/0.08)] border border-[oklch(0.7_0.17_162/0.25)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ethereum Address</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.7_0.17_162)]" />
              </div>
              <div className="flex items-center gap-2">
                <code className="crypto-addr text-[oklch(0.85_0.005_265)]">
                  {truncateAddress(address)}
                </code>
                <button
                  onClick={() => copyToClipboard(address, 'Address')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Alias */}
            <div className="p-3 rounded-lg bg-[oklch(0.75_0.18_75/0.08)] border border-[oklch(0.75_0.18_75/0.25)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Anonymous Alias</span>
              </div>
              <code className="crypto-addr text-[oklch(0.85_0.005_265)]">{userInfo.alias}</code>
            </div>

            {/* DID */}
            <div className="p-3 rounded-lg bg-[oklch(0.51_0.24_264/0.08)] border border-[oklch(0.51_0.24_264/0.25)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">W3C DID Identifier</span>
                <Shield className="w-3.5 h-3.5 text-[oklch(0.51_0.24_264)]" />
              </div>
              <div className="flex items-center gap-2">
                <code className="crypto-addr text-[oklch(0.85_0.005_265)] break-all text-[10px]">
                  {userInfo.did}
                </code>
                <button
                  onClick={() => copyToClipboard(userInfo.did, 'DID')}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ZKP Identity commitment */}
            {identityInfo && (
              <div className="p-3 rounded-lg bg-[oklch(0.75_0.18_75/0.08)] border border-[oklch(0.75_0.18_75/0.25)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Semaphore Commitment</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.75_0.18_75)]" />
                </div>
                <div className="flex items-center gap-2">
                  <code className="crypto-addr text-[oklch(0.85_0.005_265)] text-[10px] break-all">
                    {identityInfo.commitment.slice(0, 20)}…{identityInfo.commitment.slice(-10)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(identityInfo.commitment, 'Commitment')}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Public commitment only — private key never exposed
                </p>
              </div>
            )}

            {/* Etherscan link */}
            <div className="flex items-center justify-end text-xs text-muted-foreground">
              <a
                href={`https://etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                View on Etherscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              className="w-full border-[oklch(0.65_0.22_25/0.3)] text-[oklch(0.65_0.22_25)] hover:bg-[oklch(0.65_0.22_25/0.1)]"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Disconnect
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
