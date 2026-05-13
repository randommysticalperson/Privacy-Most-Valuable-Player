/**
 * ReportModal.tsx — Anonymous Vulnerability Report Modal
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Uses Semaphore ZKP to generate an anonymous proof before submitting.
 * The nullifier prevents double-reporting without revealing the reporter's identity.
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/contexts/I18nContext";
import { useSemaphore } from "@/contexts/SemaphoreContext";
import { useWallet } from "@/contexts/WalletContext";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  X,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

type Category = "reentrancy" | "overflow" | "access-control" | "oracle" | "logic" | "other";
type Severity = "low" | "medium" | "high" | "critical";

const CATEGORY_LABELS: Record<Category, { zh: string; en: string }> = {
  reentrancy: { zh: "重入攻擊", en: "Reentrancy" },
  overflow: { zh: "整數溢位", en: "Integer Overflow" },
  "access-control": { zh: "存取控制", en: "Access Control" },
  oracle: { zh: "預言機操縱", en: "Oracle Manipulation" },
  logic: { zh: "邏輯錯誤", en: "Logic Error" },
  other: { zh: "其他", en: "Other" },
};

const SEVERITY_CONFIG: Record<Severity, { label: { zh: string; en: string }; color: string; bg: string }> = {
  low: { label: { zh: "低", en: "Low" }, color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/25" },
  medium: { label: { zh: "中", en: "Medium" }, color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/25" },
  high: { label: { zh: "高", en: "High" }, color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/25" },
  critical: { label: { zh: "嚴重", en: "Critical" }, color: "text-red-400", bg: "bg-red-500/15 border-red-500/25" },
};

interface ReportModalProps {
  contractAddress: string;
  contractName?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function ReportModal({ contractAddress, contractName, onClose, onSubmitted }: ReportModalProps) {
  const { lang } = useI18n();
  const { status: zkpStatus, identityInfo, generateGroupProof, proofResult, error: zkpError, createIdentityFromWallet } = useSemaphore();
  const { address: walletAddress, isConnected } = useWallet();

  const [category, setCategory] = useState<Category>("reentrancy");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<"form" | "proving" | "submitting" | "done" | "error">("form");
  const [errorMsg, setErrorMsg] = useState("");

  // Ref to capture current form values at proof-generation time (avoids stale closure)
  const pendingRef = useRef<{ category: Category; severity: Severity; description: string } | null>(null);
  // Guard against duplicate submissions
  const submittedRef = useRef(false);

  const submitMutation = trpc.reports.submit.useMutation({
    onSuccess: () => {
      setStep("done");
      toast.success(lang === "zh" ? "匿名舉報已提交" : "Anonymous report submitted");
      onSubmitted?.();
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setStep("error");
      submittedRef.current = false; // allow retry
    },
  });

  // Watch ZKP status changes and trigger submit or error (never from render body)
  useEffect(() => {
    if (step !== "proving") return;

    if (zkpStatus === "verified" && proofResult) {
      if (submittedRef.current) return; // prevent double-fire
      submittedRef.current = true;

      if (!proofResult.isValid) {
        setErrorMsg(lang === "zh" ? "ZKP 驗證失敗" : "ZKP proof verification failed");
        setStep("error");
        submittedRef.current = false;
        return;
      }

      const pending = pendingRef.current;
      if (!pending) {
        setErrorMsg("Internal error: missing form data");
        setStep("error");
        submittedRef.current = false;
        return;
      }

      setStep("submitting");
      submitMutation.mutate({
        contractAddress,
        category: pending.category,
        severity: pending.severity,
        description: pending.description,
        nullifier: proofResult.nullifier,
        merkleTreeRoot: proofResult.merkleTreeRoot,
        proofScope: proofResult.scope,
      });
    }

    if (zkpStatus === "failed") {
      setErrorMsg(zkpError ?? (lang === "zh" ? "ZKP 生成失敗" : "ZKP generation failed"));
      setStep("error");
      submittedRef.current = false;
    }
  }, [zkpStatus, proofResult, step, zkpError, contractAddress, submitMutation, lang]);

  const handleSubmit = useCallback(async () => {
    if (description.trim().length < 20) {
      toast.error(lang === "zh" ? "描述至少需要 20 個字元" : "Description must be at least 20 characters");
      return;
    }

    setStep("proving");
    setErrorMsg("");
    submittedRef.current = false;
    pendingRef.current = { category, severity, description: description.trim() };

    try {
      // Ensure we have a Semaphore identity
      if (!identityInfo) {
        if (!isConnected || !walletAddress) {
          setErrorMsg(lang === "zh" ? "請先連接錢包以生成 ZKP 身份" : "Please connect your wallet to generate a ZKP identity");
          setStep("error");
          return;
        }
        // Derive Semaphore identity deterministically from wallet address
        await createIdentityFromWallet(walletAddress);
      }

      // Generate ZKP proof — result is picked up by the useEffect above
      const message = `report:${contractAddress.toLowerCase()}:${category}:${severity}`;
      await generateGroupProof(message);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "ZKP proof generation failed");
      setStep("error");
      submittedRef.current = false;
    }
  }, [description, category, severity, contractAddress, identityInfo, walletAddress, isConnected, createIdentityFromWallet, generateGroupProof, lang]);

  const isProving = step === "proving" || step === "submitting";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-md glass-panel p-6 space-y-5 z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {lang === "zh" ? "匿名漏洞舉報" : "Anonymous Vulnerability Report"}
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {contractName ? `${contractName} · ` : ""}
                <span className="font-mono">{contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[oklch(1_0_0/0.06)] text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ZKP privacy notice */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[oklch(0.51_0.24_264/0.08)] border border-[oklch(0.51_0.24_264/0.2)]">
          <Lock className="w-3.5 h-3.5 text-[oklch(0.51_0.24_264)] shrink-0 mt-0.5" />
          <p className="text-[10px] text-[oklch(0.51_0.24_264/0.9)] leading-relaxed">
            {lang === "zh"
              ? "此舉報使用 Semaphore ZKP 保護您的身份。系統僅記錄零知識證明的 nullifier，無法追溯至您的錢包地址。"
              : "This report uses Semaphore ZKP to protect your identity. Only the ZKP nullifier is stored — your wallet address cannot be traced."}
          </p>
        </div>

        {/* Form */}
        {(step === "form" || step === "error") && (
          <div className="space-y-4">
            {/* Category */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">
                {lang === "zh" ? "漏洞類別" : "Vulnerability Category"}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] border transition-all text-left ${
                      category === cat
                        ? "bg-[oklch(0.51_0.24_264/0.15)] border-[oklch(0.51_0.24_264/0.4)] text-[oklch(0.51_0.24_264)]"
                        : "border-border text-muted-foreground hover:border-[oklch(0.51_0.24_264/0.3)] hover:text-foreground"
                    }`}
                  >
                    {CATEGORY_LABELS[cat][lang]}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">
                {lang === "zh" ? "嚴重程度" : "Severity"}
              </label>
              <div className="flex gap-1.5">
                {(Object.keys(SEVERITY_CONFIG) as Severity[]).map(sev => {
                  const cfg = SEVERITY_CONFIG[sev];
                  return (
                    <button
                      key={sev}
                      onClick={() => setSeverity(sev)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] border transition-all font-medium ${
                        severity === sev
                          ? `${cfg.bg} ${cfg.color}`
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cfg.label[lang]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">
                {lang === "zh" ? "漏洞描述" : "Description"}
                <span className="ml-1 normal-case text-[9px]">({description.length}/2000, {lang === "zh" ? "最少 20 字" : "min 20 chars"})</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder={lang === "zh"
                  ? "描述漏洞的技術細節、觸發條件和潛在影響..."
                  : "Describe the vulnerability's technical details, trigger conditions, and potential impact..."}
                className="w-full bg-[oklch(0.12_0.01_265/0.8)] border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[oklch(0.51_0.24_264/0.5)]"
              />
            </div>

            {/* Error */}
            {step === "error" && errorMsg && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit button */}
            <Button
              onClick={handleSubmit}
              disabled={description.trim().length < 20}
              className="w-full bg-red-500/80 hover:bg-red-500 text-white gap-2"
            >
              <Zap className="w-4 h-4" />
              {lang === "zh" ? "生成 ZKP 並匿名提交" : "Generate ZKP & Submit Anonymously"}
            </Button>
          </div>
        )}

        {/* Proving / Submitting state */}
        {isProving && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-full bg-[oklch(0.51_0.24_264/0.1)] border border-[oklch(0.51_0.24_264/0.3)] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[oklch(0.51_0.24_264)] animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                {step === "proving"
                  ? (lang === "zh" ? "正在生成零知識證明..." : "Generating zero-knowledge proof...")
                  : (lang === "zh" ? "正在提交匿名舉報..." : "Submitting anonymous report...")}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {lang === "zh" ? "Semaphore Groth16 電路運算中，請稍候" : "Semaphore Groth16 circuit computing, please wait"}
              </p>
            </div>
          </div>
        )}

        {/* Done state */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                {lang === "zh" ? "匿名舉報已成功提交" : "Anonymous report submitted successfully"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {lang === "zh" ? "您的身份受到零知識證明保護，無法被追溯" : "Your identity is protected by ZKP and cannot be traced"}
              </p>
            </div>
            <Button onClick={onClose} variant="outline" className="border-border">
              {lang === "zh" ? "關閉" : "Close"}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
