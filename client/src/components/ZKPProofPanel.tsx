/**
 * ZKPProofPanel — Semaphore Zero-Knowledge Proof UI
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * i18n: all labels via useI18n()
 */

import { useState } from "react";
import { useSemaphore } from "@/contexts/SemaphoreContext";
import { useWallet } from "@/contexts/WalletContext";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle2, XCircle, Loader2, RefreshCw, Eye, EyeOff, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ZKPProofPanel() {
  const { isConnected } = useWallet();
  const {
    status,
    identityInfo,
    proofResult,
    groupSize,
    memberIndex,
    error,
    generateGroupProof,
    resetProof,
  } = useSemaphore();
  const { t, lang } = useI18n();

  const [message, setMessage] = useState(lang === "zh" ? "我是已驗證的成員" : "I am a verified member");
  const [showProofDetails, setShowProofDetails] = useState(false);

  const isGenerating = ['building-group', 'generating-proof', 'verifying'].includes(status);

  const statusLabel = {
    idle: identityInfo ? (lang === "zh" ? '準備生成證明' : 'Ready to prove') : (lang === "zh" ? '等待身份' : 'Awaiting identity'),
    'creating-identity': lang === "zh" ? '建立身份中...' : 'Creating identity...',
    'building-group': lang === "zh" ? '構建 Merkle 樹...' : 'Building Merkle Tree...',
    'generating-proof': lang === "zh" ? '生成 ZKP 證明中...' : 'Generating ZKP proof...',
    verifying: lang === "zh" ? '驗證證明中...' : 'Verifying proof...',
    verified: lang === "zh" ? '證明已驗證' : 'Proof verified',
    failed: lang === "zh" ? '證明失敗' : 'Proof failed',
  }[status];

  const handleGenerate = async () => {
    if (!message.trim()) {
      toast.error(lang === "zh" ? '請輸入訊息' : 'Please enter a message');
      return;
    }
    await generateGroupProof(message);
  };

  // Merkle tree visualization
  const renderMerkleTree = () => {
    const levels = 4;
    return (
      <div className="flex flex-col items-center gap-1 py-2">
        {Array.from({ length: levels }).map((_, level) => {
          const nodeCount = Math.pow(2, level);
          const isLeafLevel = level === levels - 1;
          return (
            <div key={level} className="flex gap-1 items-center">
              {Array.from({ length: nodeCount }).map((_, idx) => {
                const isMyNode = isLeafLevel && memberIndex !== null && idx === memberIndex % nodeCount;
                return (
                  <div
                    key={idx}
                    className={`rounded-sm transition-all duration-500 ${
                      level === 0 ? 'w-6 h-6' :
                      level === 1 ? 'w-4 h-4' :
                      level === 2 ? 'w-3 h-3' : 'w-2 h-2'
                    } ${
                      isMyNode && proofResult
                        ? 'bg-[oklch(0.7_0.17_162)] glow-emerald'
                        : isMyNode
                        ? 'bg-[oklch(0.75_0.18_75)] animate-proving'
                        : proofResult
                        ? 'bg-[oklch(0.51_0.24_264/0.5)]'
                        : 'bg-[oklch(1_0_0/0.1)]'
                    }`}
                  />
                );
              })}
            </div>
          );
        })}
        <p className="text-[10px] text-muted-foreground mt-1">
          {proofResult ? (
            <span className="text-[oklch(0.7_0.17_162)]">
              {lang === "zh" ? "你的節點隱藏在樹中" : "Your node is hidden in the tree"}
            </span>
          ) : (
            `${groupSize} ${lang === "zh" ? "位成員在群組中" : "members in group"}`
          )}
        </p>
      </div>
    );
  };

  return (
    <div className="glass-panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
            status === 'verified' ? 'border-[oklch(0.7_0.17_162/0.5)] text-[oklch(0.7_0.17_162)] bg-[oklch(0.7_0.17_162/0.1)]' :
            isGenerating ? 'border-[oklch(0.75_0.18_75/0.5)] text-[oklch(0.75_0.18_75)] animate-proving' :
            'border-[oklch(0.51_0.24_264/0.3)] text-[oklch(0.51_0.24_264)]'
          }`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("zkpTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">{t("zkpSubtitle")}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${
            status === 'verified' ? 'text-[oklch(0.7_0.17_162)] border-[oklch(0.7_0.17_162/0.4)]' :
            isGenerating ? 'text-[oklch(0.75_0.18_75)] border-[oklch(0.75_0.18_75/0.4)]' :
            'text-muted-foreground border-border'
          }`}
        >
          {statusLabel}
        </Badge>
      </div>

      {/* Merkle tree visualization */}
      <div className="p-3 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {lang === "zh" ? `群組 Merkle 樹（${groupSize} 位成員）` : `Group Merkle Tree (${groupSize} members)`}
          </span>
        </div>
        {renderMerkleTree()}
      </div>

      {/* Not connected */}
      {!isConnected && (
        <p className="text-xs text-muted-foreground text-center py-2">
          {lang === "zh" ? "請先連接錢包以建立 Semaphore 身份" : "Connect wallet to create a Semaphore identity"}
        </p>
      )}

      {/* Ready to prove */}
      {isConnected && identityInfo && status !== 'verified' && !isGenerating && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              {lang === "zh" ? "匿名訊息" : "Anonymous Message"}
            </label>
            <Input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={lang === "zh" ? "輸入您的匿名訊息..." : "Enter your anonymous message..."}
              className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm font-mono"
              maxLength={64}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              {lang === "zh"
                ? "此訊息包含在證明中，但無法追溯到您的身份"
                : "This message is included in the proof but cannot be traced back to your identity"}
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!message.trim()}
            className="w-full bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Zap className="w-4 h-4 mr-2" />
            {t("zkpGenProof")}
          </Button>
        </div>
      )}

      {/* Generating */}
      {isGenerating && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-[oklch(0.75_0.18_75/0.3)] animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[oklch(0.75_0.18_75)] animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-[oklch(0.75_0.18_75)]">{statusLabel}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {status === 'building-group' && (lang === "zh" ? '正從群組成員構建 Merkle 樹...' : 'Building Merkle tree from group members...')}
              {status === 'generating-proof' && (lang === "zh" ? '執行 Groth16 電路中，請稍候...' : 'Running Groth16 circuit, please wait...')}
              {status === 'verifying' && (lang === "zh" ? '在本地驗證證明有效性...' : 'Verifying proof locally...')}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && status === 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 rounded-lg bg-[oklch(0.65_0.22_25/0.1)] border border-[oklch(0.65_0.22_25/0.3)]"
          >
            <XCircle className="w-4 h-4 text-[oklch(0.65_0.22_25)] mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-[oklch(0.65_0.22_25)]">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetProof} className="h-6 px-2 text-xs">
              <RefreshCw className="w-3 h-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proof result */}
      <AnimatePresence>
        {proofResult && status === 'verified' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Verification badge */}
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              proofResult.isValid
                ? 'bg-[oklch(0.7_0.17_162/0.08)] border-[oklch(0.7_0.17_162/0.3)]'
                : 'bg-[oklch(0.65_0.22_25/0.08)] border-[oklch(0.65_0.22_25/0.3)]'
            }`}>
              {proofResult.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-[oklch(0.7_0.17_162)]" />
              ) : (
                <XCircle className="w-5 h-5 text-[oklch(0.65_0.22_25)]" />
              )}
              <div>
                <p className={`text-sm font-semibold ${proofResult.isValid ? 'text-[oklch(0.7_0.17_162)]' : 'text-[oklch(0.65_0.22_25)]'}`}
                   style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {proofResult.isValid ? t("zkpVerifiedOk") : t("zkpVerifiedFail")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === "zh" ? "已證明成員身份，未暴露真實身份" : "Membership proved without revealing identity"}
                </p>
              </div>
            </div>

            {/* Key proof fields */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
                <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">
                  {t("zkpNullifierLabel")}
                </p>
                <code className="crypto-addr text-[oklch(0.85_0.005_265)] text-[10px] break-all">
                  {proofResult.nullifier.slice(0, 30)}...
                </code>
              </div>
              <div className="p-2.5 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
                <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">Merkle Root</p>
                <code className="crypto-addr text-[oklch(0.85_0.005_265)] text-[10px] break-all">
                  {proofResult.merkleTreeRoot.slice(0, 30)}...
                </code>
              </div>
              <div className="p-2.5 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
                <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">Tree Depth</p>
                <code className="crypto-addr text-[oklch(0.85_0.005_265)]">
                  {proofResult.merkleTreeDepth} levels ({Math.pow(2, proofResult.merkleTreeDepth)} max members)
                </code>
              </div>
            </div>

            {/* Toggle proof details */}
            <button
              onClick={() => setShowProofDetails(v => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showProofDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showProofDetails
                ? (lang === "zh" ? "隱藏" : "Hide")
                : (lang === "zh" ? "顯示" : "Show")
              } Groth16 {lang === "zh" ? "證明點" : "proof points"}
            </button>

            <AnimatePresence>
              {showProofDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-lg bg-[oklch(0.09_0.02_265)] border border-border overflow-hidden"
                >
                  <pre className="text-[9px] text-muted-foreground overflow-auto max-h-32 font-mono">
                    {JSON.stringify(proofResult.proof, null, 2)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="outline"
              size="sm"
              onClick={resetProof}
              className="w-full border-border text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              {lang === "zh" ? "重新生成證明" : "Regenerate Proof"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
