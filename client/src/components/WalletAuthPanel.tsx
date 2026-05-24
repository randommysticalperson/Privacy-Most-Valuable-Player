/**
 * WalletAuthPanel — DID/Wallet Authentication UI
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * Trust colors: grey (disconnected) → amber (connecting) → emerald (connected)
 * Supports: MetaMask (EIP-1193) + Burner Wallet (in-browser ephemeral keypair)
 * i18n: all labels via useI18n()
 */

import { useWallet } from "@/contexts/WalletContext";
import { useSemaphore } from "@/contexts/SemaphoreContext";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Copy,
  ExternalLink,
  Flame,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function WalletAuthPanel() {
  const {
    isConnected,
    isConnecting,
    walletType,
    address,
    userInfo,
    hasProvider,
    connect,
    disconnect,
    createBurner,
    burnWallet,
  } = useWallet();
  const { createIdentityFromWallet, identityInfo, status: zkpStatus } = useSemaphore();
  const { t, lang } = useI18n();

  // Auto-create Semaphore identity when wallet connects
  useEffect(() => {
    if (isConnected && address && !identityInfo && zkpStatus === "idle") {
      createIdentityFromWallet(address);
    }
  }, [isConnected, address, identityInfo, zkpStatus, createIdentityFromWallet]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${lang === "zh" ? "已複製到剪貼簿" : "copied to clipboard"}`);
  };

  const isBurner = walletType === "burner";

  const statusLabel = isConnecting
    ? t("walletConnecting")
    : isConnected
    ? isBurner
      ? lang === "zh" ? "燃燒錢包" : "Burner"
      : t("walletConnected")
    : lang === "zh" ? "未連接" : "Not connected";

  const statusColor = isConnecting
    ? "text-[oklch(0.75_0.18_75)]"
    : isConnected
    ? isBurner
      ? "text-[oklch(0.72_0.22_30)]"
      : "text-[oklch(0.7_0.17_162)]"
    : "text-[oklch(0.6_0.01_265)]";

  const statusBorder = isConnecting
    ? "border-[oklch(0.75_0.18_75/0.4)]"
    : isConnected
    ? isBurner
      ? "border-[oklch(0.72_0.22_30/0.4)]"
      : "border-[oklch(0.7_0.17_162/0.4)]"
    : "border-[oklch(0.6_0.01_265/0.3)]";

  // Step indicators
  const steps = [t("walletStepConnect"), t("walletStepVerify"), t("walletStepDID"), t("walletStepZKP")];
  const stepDone = (i: number) =>
    (i === 0 && isConnected) ||
    (i === 1 && isConnected) ||
    (i === 2 && isConnected) ||
    (i === 3 && !!identityInfo);
  const stepActive = (i: number) =>
    (i === 0 && isConnecting) ||
    (i === 3 && zkpStatus === "creating-identity");

  return (
    <div className="glass-panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${statusBorder} ${statusColor}`}
          >
            {isBurner ? <Flame className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          </div>
          <div>
            <h3
              className="font-semibold text-sm"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {t("walletTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">{t("walletSubtitle")}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${statusColor} ${statusBorder} border`}
        >
          {statusLabel}
        </Badge>
      </div>

      {/* Step flow indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-1">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                stepDone(i)
                  ? "bg-[oklch(0.7_0.17_162/0.2)] border-[oklch(0.7_0.17_162/0.5)] text-[oklch(0.7_0.17_162)]"
                  : stepActive(i)
                  ? "bg-[oklch(0.75_0.18_75/0.2)] border-[oklch(0.75_0.18_75/0.5)] text-[oklch(0.75_0.18_75)]"
                  : "border-[oklch(1_0_0/0.1)] text-muted-foreground"
              }`}
            >
              {stepDone(i) ? "✓" : i + 1}
            </div>
            <span className={stepDone(i) ? "text-[oklch(0.7_0.17_162)]" : ""}>{step}</span>
            {i < steps.length - 1 && <div className="w-4 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Burner wallet ephemeral warning */}
      {isBurner && isConnected && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[oklch(0.72_0.22_30/0.08)] border border-[oklch(0.72_0.22_30/0.3)]">
          <AlertTriangle className="w-4 h-4 text-[oklch(0.72_0.22_30)] mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs text-[oklch(0.72_0.22_30)] font-medium">
              {lang === "zh" ? "燃燒錢包 — 僅存在於此瀏覽器" : "Burner Wallet — exists only in this browser"}
            </p>
            <p className="text-[10px] text-[oklch(0.72_0.22_30/0.8)]">
              {lang === "zh"
                ? "私鑰以 AES-GCM 加密儲存於 localStorage。關閉分頁不會刪除它，請手動點擊「銷毀」。"
                : "Private key is AES-GCM encrypted in localStorage. Closing the tab does NOT delete it — click Burn to wipe it."}
            </p>
          </div>
        </div>
      )}

      {/* No MetaMask provider notice (shown only when disconnected) */}
      {!hasProvider && !isConnected && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[oklch(0.65_0.22_25/0.1)] border border-[oklch(0.65_0.22_25/0.3)]">
          <AlertCircle className="w-4 h-4 text-[oklch(0.65_0.22_25)] mt-0.5 shrink-0" />
          <p className="text-xs text-[oklch(0.65_0.22_25)]">
            {t("walletNotDetected")}{" "}
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              MetaMask
            </a>{" "}
            {t("walletInstallLink")}
          </p>
        </div>
      )}

      {/* Not connected state */}
      {!isConnected && !isConnecting && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("walletDesc")}
          </p>

          {/* MetaMask connect */}
          <Button
            onClick={connect}
            className="w-full bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white font-medium"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Wallet className="w-4 h-4 mr-2" />
            {t("walletConnect")}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground">
              {lang === "zh" ? "或" : "or"}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Burner wallet create */}
          <Button
            onClick={createBurner}
            variant="outline"
            className="w-full border-[oklch(0.72_0.22_30/0.4)] text-[oklch(0.72_0.22_30)] hover:bg-[oklch(0.72_0.22_30/0.08)] hover:border-[oklch(0.72_0.22_30/0.6)] font-medium"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Flame className="w-4 h-4 mr-2" />
            {lang === "zh" ? "建立燃燒錢包（免安裝）" : "Create Burner Wallet (no install)"}
          </Button>

          <div className="space-y-1">
            <p className="text-[10px] text-center text-muted-foreground">
              {t("walletSupports")}
            </p>
            <p className="text-[10px] text-center text-muted-foreground/60">
              {lang === "zh"
                ? "燃燒錢包：在瀏覽器中即時生成匿名金鑰對，無需安裝任何擴充套件"
                : "Burner Wallet: generates an anonymous keypair instantly in-browser, no extension needed"}
            </p>
          </div>
        </div>
      )}

      {/* Connecting state */}
      {isConnecting && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="w-8 h-8 text-[oklch(0.75_0.18_75)] animate-spin" />
          <p className="text-sm text-[oklch(0.75_0.18_75)]">{t("walletConnecting")}</p>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            {lang === "zh"
              ? "正在生成您的匿名錢包..."
              : "Generating your anonymous wallet..."}
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
            {/* Wallet type badge */}
            <div className="flex items-center gap-2">
              {isBurner ? (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[oklch(0.72_0.22_30/0.1)] border border-[oklch(0.72_0.22_30/0.3)] text-[10px] text-[oklch(0.72_0.22_30)]">
                  <Flame className="w-3 h-3" />
                  {lang === "zh" ? "燃燒錢包（臨時）" : "Burner Wallet (ephemeral)"}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[oklch(0.51_0.24_264/0.1)] border border-[oklch(0.51_0.24_264/0.3)] text-[10px] text-[oklch(0.51_0.24_264)]">
                  <Zap className="w-3 h-3" />
                  MetaMask / EIP-1193
                </div>
              )}
            </div>

            {/* Address */}
            <div className="p-3 rounded-lg bg-[oklch(0.7_0.17_162/0.08)] border border-[oklch(0.7_0.17_162/0.25)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {lang === "zh" ? "以太坊地址" : "Ethereum Address"}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.7_0.17_162)]" />
              </div>
              <div className="flex items-center gap-2">
                <code className="crypto-addr text-[oklch(0.85_0.005_265)]">
                  {truncateAddress(address)}
                </code>
                <button
                  onClick={() => copyToClipboard(address, t("walletAddress"))}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Alias */}
            <div className="p-3 rounded-lg bg-[oklch(0.75_0.18_75/0.08)] border border-[oklch(0.75_0.18_75/0.25)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {t("walletAnonymousAlias")}
                </span>
              </div>
              <code className="crypto-addr text-[oklch(0.85_0.005_265)]">{userInfo.alias}</code>
            </div>

            {/* DID */}
            <div className="p-3 rounded-lg bg-[oklch(0.51_0.24_264/0.08)] border border-[oklch(0.51_0.24_264/0.25)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {lang === "zh" ? "W3C DID 識別符" : "W3C DID Identifier"}
                </span>
                <Shield className="w-3.5 h-3.5 text-[oklch(0.51_0.24_264)]" />
              </div>
              <div className="flex items-center gap-2">
                <code className="crypto-addr text-[oklch(0.85_0.005_265)] break-all text-[10px]">
                  {userInfo.did}
                </code>
                <button
                  onClick={() => copyToClipboard(userInfo.did, t("walletDID"))}
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
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {lang === "zh" ? "Semaphore 承諾值" : "Semaphore Commitment"}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.75_0.18_75)]" />
                </div>
                <div className="flex items-center gap-2">
                  <code className="crypto-addr text-[oklch(0.85_0.005_265)] text-[10px] break-all">
                    {identityInfo.commitment.slice(0, 20)}…{identityInfo.commitment.slice(-10)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(identityInfo.commitment, "Commitment")}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {lang === "zh"
                    ? "僅公開承諾值——私鑰永不暴露"
                    : "Only commitment is public — private key never exposed"}
                </p>
              </div>
            )}

            {/* Etherscan link (not shown for burner — no on-chain activity) */}
            {!isBurner && (
              <div className="flex items-center justify-end text-xs text-muted-foreground">
                <a
                  href={`https://etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  {lang === "zh" ? "在 Etherscan 查看" : "View on Etherscan"}{" "}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Action buttons */}
            {isBurner ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={burnWallet}
                  className="flex-1 border-[oklch(0.65_0.25_20/0.4)] text-[oklch(0.65_0.25_20)] hover:bg-[oklch(0.65_0.25_20/0.1)] hover:border-[oklch(0.65_0.25_20/0.6)]"
                >
                  <Flame className="w-3.5 h-3.5 mr-2" />
                  {lang === "zh" ? "銷毀錢包" : "Burn & Forget"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                  className="border-border text-muted-foreground hover:bg-muted/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="w-full border-[oklch(0.65_0.22_25/0.3)] text-[oklch(0.65_0.22_25)] hover:bg-[oklch(0.65_0.22_25/0.1)]"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                {t("disconnect")}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
