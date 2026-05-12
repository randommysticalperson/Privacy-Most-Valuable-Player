/**
 * EtherscanLookup.tsx — Live Etherscan Contract Lookup
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Features:
 * - Address input with validation
 * - Network selector (Mainnet / Sepolia)
 * - Verification status badge
 * - ABI viewer (collapsible function list)
 * - Source code viewer (syntax-highlighted, truncated)
 * - Recent transactions list
 * - Copy-to-clipboard for address / ABI
 */
import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/contexts/I18nContext";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShieldCheck,
  ShieldX,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code,
  Zap,
  ArrowLeftRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// Validate Ethereum address
function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

// Truncate address for display
function truncateAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

type Network = "mainnet" | "sepolia";

interface ABIItem {
  type: string;
  name?: string;
  inputs?: { name: string; type: string }[];
  outputs?: { name: string; type: string }[];
  stateMutability?: string;
}

export default function EtherscanLookup() {
  const { t } = useI18n();
  const [inputAddress, setInputAddress] = useState("");
  const [queryAddress, setQueryAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network>("mainnet");
  const [showABI, setShowABI] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [showTxs, setShowTxs] = useState(false);

  // tRPC query — only fires when queryAddress is set
  const contractQuery = trpc.etherscan.lookupContract.useQuery(
    { address: queryAddress!, network },
    {
      enabled: !!queryAddress,
      retry: false,
      staleTime: 60_000, // cache for 1 minute
    }
  );

  const txQuery = trpc.etherscan.getTransactions.useQuery(
    { address: queryAddress!, network, limit: 10 },
    {
      enabled: !!queryAddress && showTxs,
      retry: false,
      staleTime: 30_000,
    }
  );

  const handleLookup = useCallback(() => {
    const addr = inputAddress.trim();
    if (!isValidAddress(addr)) {
      toast.error(t("etherscanInvalidAddress"));
      return;
    }
    setQueryAddress(addr);
    setShowABI(false);
    setShowSource(false);
    setShowTxs(false);
  }, [inputAddress, t]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} ${t("copied")}`);
    });
  };

  const contract = contractQuery.data;
  const txs = txQuery.data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Search className="w-4 h-4 text-[oklch(0.51_0.24_264)]" />
        <h3
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {t("etherscanTitle")}
        </h3>
      </div>

      {/* Network selector + address input */}
      <div className="flex gap-2">
        <select
          value={network}
          onChange={e => setNetwork(e.target.value as Network)}
          className="bg-[oklch(0.12_0.01_265/0.8)] border border-border text-foreground text-xs rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[oklch(0.51_0.24_264/0.5)] shrink-0"
        >
          <option value="mainnet">Mainnet</option>
          <option value="sepolia">Sepolia</option>
        </select>

        <Input
          value={inputAddress}
          onChange={e => setInputAddress(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLookup()}
          placeholder="0x..."
          className="flex-1 bg-[oklch(0.12_0.01_265/0.8)] border-border text-foreground placeholder:text-muted-foreground text-xs font-mono"
        />

        <Button
          onClick={handleLookup}
          disabled={contractQuery.isFetching}
          size="sm"
          className="bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.45_0.24_264)] text-white shrink-0"
        >
          {contractQuery.isFetching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      {/* Error state */}
      {contractQuery.isError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
        >
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{contractQuery.error.message}</span>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {contract && (
          <motion.div
            key={contract.address}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Summary card */}
            <div className="p-3 rounded-xl bg-[oklch(0.12_0.01_265/0.6)] border border-border space-y-2.5">
              {/* Address row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t("etherscanAddress")}
                  </span>
                  <span className="font-mono text-xs text-foreground">
                    {truncateAddr(contract.address)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyToClipboard(contract.address, t("etherscanAddress"))}
                    className="p-1 rounded hover:bg-[oklch(1_0_0/0.05)] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <a
                    href={contract.etherscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-[oklch(1_0_0/0.05)] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Verification status */}
              <div className="flex items-center gap-2 flex-wrap">
                {contract.verified ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {t("etherscanVerified")}
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[10px] gap-1">
                    <ShieldX className="w-3 h-3" />
                    {t("etherscanUnverified")}
                  </Badge>
                )}

                {contract.isProxy && (
                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[10px] gap-1">
                    <ArrowLeftRight className="w-3 h-3" />
                    Proxy
                  </Badge>
                )}

                <Badge className="bg-[oklch(0.51_0.24_264/0.15)] text-[oklch(0.51_0.24_264)] border-[oklch(0.51_0.24_264/0.2)] text-[10px]">
                  {network === "sepolia" ? "Sepolia" : "Mainnet"}
                </Badge>
              </div>

              {/* Contract details grid */}
              {contract.verified && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                  {contract.contractName && (
                    <>
                      <span className="text-muted-foreground">{t("etherscanContractName")}</span>
                      <span className="text-foreground font-medium truncate">{contract.contractName}</span>
                    </>
                  )}
                  {contract.compilerVersion && (
                    <>
                      <span className="text-muted-foreground">{t("etherscanCompiler")}</span>
                      <span className="text-foreground font-mono truncate text-[10px]">{contract.compilerVersion}</span>
                    </>
                  )}
                  {contract.licenseType && (
                    <>
                      <span className="text-muted-foreground">{t("etherscanLicense")}</span>
                      <span className="text-foreground">{contract.licenseType}</span>
                    </>
                  )}
                  <>
                    <span className="text-muted-foreground">{t("etherscanOptimization")}</span>
                    <span className={contract.optimizationUsed ? "text-emerald-400" : "text-muted-foreground"}>
                      {contract.optimizationUsed ? t("etherscanEnabled") : t("etherscanDisabled")}
                    </span>
                  </>
                  {contract.evmVersion && (
                    <>
                      <span className="text-muted-foreground">EVM</span>
                      <span className="text-foreground">{contract.evmVersion}</span>
                    </>
                  )}
                  <>
                    <span className="text-muted-foreground">ETH {t("etherscanBalance")}</span>
                    <span className="text-foreground font-mono">{contract.ethBalance} ETH</span>
                  </>
                </div>
              )}

              {/* Proxy implementation */}
              {contract.isProxy && contract.implementationAddress && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px]">
                  <Info className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-amber-300">
                    {t("etherscanImplementation")}:{" "}
                    <a
                      href={`https://${network === "sepolia" ? "sepolia." : ""}etherscan.io/address/${contract.implementationAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono underline"
                    >
                      {truncateAddr(contract.implementationAddress)}
                    </a>
                  </span>
                </div>
              )}
            </div>

            {/* ABI section */}
            {contract.verified && contract.abi.length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setShowABI(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-[oklch(0.12_0.01_265/0.6)] hover:bg-[oklch(0.14_0.01_265/0.6)] transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-[oklch(0.51_0.24_264)]" />
                    <span className="font-medium text-foreground">
                      ABI — {contract.abi.length} {t("etherscanFunctions")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        copyToClipboard(JSON.stringify(contract.abi, null, 2), "ABI");
                      }}
                      className="p-1 rounded hover:bg-[oklch(1_0_0/0.08)] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {showABI ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </button>

                <AnimatePresence>
                  {showABI && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="max-h-64 overflow-y-auto divide-y divide-border bg-[oklch(0.09_0.01_265/0.8)]">
                        {(contract.abi as ABIItem[]).map((item, i) => (
                          <div key={i} className="px-3 py-2 text-[11px] font-mono">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`text-[9px] px-1.5 py-0 ${
                                  item.type === "function"
                                    ? item.stateMutability === "view" || item.stateMutability === "pure"
                                      ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
                                      : "bg-amber-500/15 text-amber-400 border-amber-500/20"
                                    : item.type === "event"
                                    ? "bg-purple-500/15 text-purple-400 border-purple-500/20"
                                    : "bg-gray-500/15 text-gray-400 border-gray-500/20"
                                }`}
                              >
                                {item.type}
                              </Badge>
                              <span className="text-foreground font-semibold">{item.name || "(fallback)"}</span>
                              {item.stateMutability && (
                                <span className="text-muted-foreground text-[10px]">{item.stateMutability}</span>
                              )}
                            </div>
                            {item.inputs && item.inputs.length > 0 && (
                              <div className="mt-1 text-muted-foreground text-[10px] pl-2">
                                ({item.inputs.map(inp => `${inp.type} ${inp.name}`).join(", ")})
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Source code section */}
            {contract.verified && contract.sourceCode && (
              <div className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setShowSource(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-[oklch(0.12_0.01_265/0.6)] hover:bg-[oklch(0.14_0.01_265/0.6)] transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-medium text-foreground">
                      {t("etherscanSourceCode")}
                      {contract.sourceCodeTruncated && (
                        <span className="ml-1 text-muted-foreground text-[10px]">(8KB preview)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        copyToClipboard(contract.sourceCode, t("etherscanSourceCode"));
                      }}
                      className="p-1 rounded hover:bg-[oklch(1_0_0/0.08)] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {showSource ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </button>

                <AnimatePresence>
                  {showSource && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <pre className="max-h-80 overflow-auto p-3 text-[10px] font-mono text-emerald-300/80 bg-[oklch(0.07_0.01_265/0.9)] leading-relaxed whitespace-pre-wrap break-all">
                        {contract.sourceCode}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Transactions section */}
            <div className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setShowTxs(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-[oklch(0.12_0.01_265/0.6)] hover:bg-[oklch(0.14_0.01_265/0.6)] transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-foreground">{t("etherscanRecentTxs")}</span>
                  {txQuery.isFetching && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                </div>
                {showTxs ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {showTxs && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-64 overflow-y-auto divide-y divide-border bg-[oklch(0.09_0.01_265/0.8)]">
                      {!txs || txs.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                          {txQuery.isFetching ? t("etherscanLoading") : t("etherscanNoTxs")}
                        </div>
                      ) : (
                        txs.map(tx => (
                          <div key={tx.hash} className="px-3 py-2 text-[11px] space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {tx.isError ? (
                                  <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                )}
                                <a
                                  href={`https://${network === "sepolia" ? "sepolia." : ""}etherscan.io/tx/${tx.hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-[oklch(0.51_0.24_264)] hover:underline text-[10px]"
                                >
                                  {truncateAddr(tx.hash)}
                                </a>
                              </div>
                              <span className="text-muted-foreground text-[10px] shrink-0">
                                {new Date(tx.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground pl-4.5">
                              <span className="truncate max-w-[160px]">{tx.functionName}</span>
                              <span className="shrink-0">{tx.valueEth} ETH</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-muted-foreground/60 text-center px-2">
              {t("etherscanDisclaimer")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!contract && !contractQuery.isFetching && !contractQuery.isError && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Search className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">{t("etherscanEmptyState")}</p>
        </div>
      )}
    </div>
  );
}
