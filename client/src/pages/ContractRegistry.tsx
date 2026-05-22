/**
 * ContractRegistry.tsx — Smart Contract Registry Page
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * Lists audited contracts from trusted sources with risk scoring, compliance tags,
 * audit records, and live Etherscan address lookup.
 *
 * DISCLAIMER: For informational purposes only. Audit reports do not guarantee
 * absence of vulnerabilities. Always verify from official protocol documentation.
 */

import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/contexts/I18nContext";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EtherscanLookupPanel from "@/components/EtherscanLookup";
import ReportModal from "@/components/ReportModal";
import {
  Search,
  ExternalLink,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen,
  Github,
  Filter,
  ArrowLeft,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  CONTRACT_REGISTRY,
  RISK_CONFIG,
  COMPLIANCE_CONFIG,
  CATEGORIES,
  filterContracts,
  formatTvl,
  truncateAddress,
  type ContractEntry,
  type RiskLevel,
  type ContractCategory,
  type ComplianceTag,
} from "@/lib/contractRegistry";

// ─── Risk icon ────────────────────────────────────────────────────────────────

function RiskIcon({ level, size = 16 }: { level: RiskLevel; size?: number }) {
  const s = { width: size, height: size };
  if (level === "minimal" || level === "low")
    return <ShieldCheck style={s} className="text-[oklch(0.7_0.17_162)]" />;
  if (level === "medium")
    return <Shield style={s} className="text-[oklch(0.75_0.18_75)]" />;
  if (level === "high")
    return <ShieldAlert style={s} className="text-[oklch(0.7_0.22_30)]" />;
  return <ShieldX style={s} className="text-[oklch(0.65_0.25_20)]" />;
}

// ─── Contract Card ────────────────────────────────────────────────────────────────

function ContractCard({ contract, onLookup }: { contract: ContractEntry; onLookup?: (address: string) => void }) {
  const { lang } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const risk = RISK_CONFIG[contract.riskLevel];

  // Fetch report count for this contract (only for real addresses)
  const isRealAddress = contract.address !== "0x0000000000000000000000000000000000000000";
  const countQuery = trpc.reports.count.useQuery(
    { contractAddress: contract.address },
    { enabled: isRealAddress, staleTime: 30_000 }
  );
  const reportCount = countQuery.data?.count ?? 0;

  // Fetch full report list — only when the card is expanded
  const reportsQuery = trpc.reports.list.useQuery(
    { contractAddress: contract.address },
    { enabled: isRealAddress && expanded, staleTime: 30_000 }
  );

  // Derive whether any report is critical or high (for warning banner)
  const hasSevereReport = reportsQuery.data?.some(
    (r) => r.severity === "critical" || r.severity === "high"
  ) ?? false;

  // Track which report rows are expanded to full text
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set());
  const toggleReportExpand = (id: number) =>
    setExpandedReports((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const copyAddress = () => {
    navigator.clipboard.writeText(contract.address);
    toast.success(lang === "zh" ? "地址已複製" : "Address copied");
  };

  const totalFindings = contract.audits.reduce(
    (acc, a) =>
      acc + a.findings.critical + a.findings.high + a.findings.medium + a.findings.low,
    0
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`glass-panel p-4 space-y-3 border transition-colors ${
        contract.riskLevel === "critical"
          ? "border-[oklch(0.65_0.25_20/0.4)] bg-[oklch(0.65_0.25_20/0.04)]"
          : "border-border hover:border-[oklch(0.51_0.24_264/0.3)]"
      }`}
    >
      {/* Severe report warning banner — shown once reports are loaded and any is critical/high */}
      {hasSevereReport && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-[10px] text-red-400">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>
            {lang === "zh"
              ? "社群舉報：此合約含有高/嚴重等級漏洞警示"
              : "Community alert: this contract has high/critical severity reports"}
          </span>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              background: `${risk.bg}`,
              borderColor: `${risk.border}`,
            }}
          >
            <RiskIcon level={contract.riskLevel} size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="font-semibold text-sm text-foreground"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {contract.name}
              </h3>
              {contract.verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.7_0.17_162)] shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground">{contract.protocol}</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground">{contract.category}</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground">{contract.chain}</span>
            </div>
          </div>
        </div>

        {/* Risk badge */}
        <div
          className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border"
          style={{
            color: `${risk.color}`,
            background: `${risk.bg}`,
            borderColor: `${risk.border}`,
          }}
        >
          {lang === "zh" ? risk.label : contract.riskLevel.toUpperCase()}
        </div>
      </div>

      {/* Address row */}
      {contract.address !== "0x0000000000000000000000000000000000000000" && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
          <code className="crypto-addr text-[10px] text-muted-foreground flex-1 truncate">
            {contract.address}
          </code>
          <button onClick={copyAddress} className="shrink-0 hover:text-foreground text-muted-foreground" title={lang === "zh" ? "複製地址" : "Copy address"}>
            <Copy className="w-3 h-3" />
          </button>
          {onLookup && (
            <button
              onClick={() => onLookup(contract.address)}
              className="shrink-0 hover:text-[oklch(0.51_0.24_264)] text-muted-foreground transition-colors"
              title={lang === "zh" ? "即時查詢" : "Live Lookup"}
            >
              <Zap className="w-3 h-3" />
            </button>
          )}
          <a
            href={contract.etherscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 hover:text-[oklch(0.51_0.24_264)] text-muted-foreground"
            title="Etherscan"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed">{contract.description}</p>

      {/* Compliance tags */}
      <div className="flex flex-wrap gap-1.5">
        {contract.complianceTags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full border"
            style={{
              color: COMPLIANCE_CONFIG[tag].color,
              borderColor: `${COMPLIANCE_CONFIG[tag].color}40`,
              background: `${COMPLIANCE_CONFIG[tag].color}10`,
            }}
          >
            {lang === "zh" ? COMPLIANCE_CONFIG[tag].label : tag}
          </span>
        ))}
        {contract.tvlUsd !== undefined && contract.tvlUsd > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
            TVL {formatTvl(contract.tvlUsd)}
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
          {lang === "zh" ? "部署" : "Deployed"} {contract.deployedAt}
        </span>
      </div>

      {/* Warning note */}
      {contract.warningNote && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[oklch(0.75_0.18_75/0.06)] border border-[oklch(0.75_0.18_75/0.2)]">
          <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.75_0.18_75)] shrink-0 mt-0.5" />
          <p className="text-[10px] text-[oklch(0.75_0.18_75)] leading-relaxed">
            {contract.warningNote}
          </p>
        </div>
      )}

      {/* Footer row: expand toggle + report button */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors flex-1"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {lang === "zh"
            ? `${contract.audits.length} 份審計報告 · ${totalFindings} 項發現`
            : `${contract.audits.length} audit report${contract.audits.length !== 1 ? "s" : ""} · ${totalFindings} findings`}
        </button>

        {isRealAddress && (
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1 text-[10px] text-red-400/70 hover:text-red-400 transition-colors shrink-0 px-2 py-1 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
            title={lang === "zh" ? "匿名舉報漏洞" : "Report vulnerability anonymously"}
          >
            <ShieldAlert className="w-3 h-3" />
            {lang === "zh" ? "匿名舉報" : "Report"}
            {reportCount > 0 && (
              <span className="ml-0.5 px-1 py-0 rounded-full bg-red-500/20 text-red-400 text-[9px] font-medium">
                {reportCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReport && (
          <ReportModal
            contractAddress={contract.address}
            contractName={contract.name}
            onClose={() => setShowReport(false)}
            onSubmitted={() => {
              setShowReport(false);
              countQuery.refetch();
            }}
          />
        )}
      </AnimatePresence>

      {/* Expanded audit records */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {contract.audits.map((audit, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-[oklch(0.51_0.24_264)]" />
                    <span className="text-xs font-medium text-foreground">{audit.firm}</span>
                    <span className="text-[10px] text-muted-foreground">{audit.date}</span>
                  </div>
                  <a
                    href={audit.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[oklch(0.51_0.24_264)] hover:underline flex items-center gap-1"
                  >
                    {lang === "zh" ? "報告" : "Report"} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="flex gap-3 text-[10px]">
                  {audit.findings.critical > 0 && (
                    <span className="text-[oklch(0.65_0.25_20)]">
                      Critical: {audit.findings.critical}
                    </span>
                  )}
                  <span
                    className={
                      audit.findings.high > 0
                        ? "text-[oklch(0.7_0.22_30)]"
                        : "text-muted-foreground"
                    }
                  >
                    High: {audit.findings.high}
                  </span>
                  <span
                    className={
                      audit.findings.medium > 0
                        ? "text-[oklch(0.75_0.18_75)]"
                        : "text-muted-foreground"
                    }
                  >
                    Med: {audit.findings.medium}
                  </span>
                  <span className="text-muted-foreground">Low: {audit.findings.low}</span>
                </div>
              </div>
            ))}

            {/* Anonymous vulnerability reports */}
            {isRealAddress && (
              <div className="pt-1 space-y-2">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-red-400/70" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {lang === "zh" ? "匿名漏洞舉報" : "Anonymous Vulnerability Reports"}
                    {reportCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0 rounded-full bg-red-500/20 text-red-400 normal-case tracking-normal">
                        {reportCount}
                      </span>
                    )}
                  </span>
                </div>

                {/* Loading state */}
                {reportsQuery.isLoading && (
                  <div className="flex items-center gap-2 py-2 text-[10px] text-muted-foreground">
                    <div className="w-3 h-3 border border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    {lang === "zh" ? "載入舉報中..." : "Loading reports..."}
                  </div>
                )}

                {/* Error state */}
                {reportsQuery.isError && (
                  <div className="flex items-center gap-2 py-2.5 px-3 rounded-lg bg-red-500/8 border border-red-500/15 text-[10px] text-red-400/80">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>
                      {lang === "zh" ? "載入舉報失敗，請" : "Failed to load reports. "}
                    </span>
                    <button
                      onClick={() => reportsQuery.refetch()}
                      className="underline hover:text-red-400 transition-colors"
                    >
                      {lang === "zh" ? "重試" : "Retry"}
                    </button>
                  </div>
                )}

                {/* Empty state */}
                {!reportsQuery.isLoading && !reportsQuery.isError && reportsQuery.data && reportsQuery.data.length === 0 && (
                  <div className="py-3 text-center text-[10px] text-muted-foreground/60 border border-dashed border-border rounded-lg">
                    {lang === "zh" ? "目前尚無匿名舉報" : "No anonymous reports yet"}
                  </div>
                )}

                {/* Report rows */}
                {reportsQuery.data && reportsQuery.data.length > 0 && (
                  <div className="space-y-1.5">
                    {reportsQuery.data.map((report) => {
                      const SEVERITY_STYLES: Record<string, { color: string; bg: string }> = {
                        low:      { color: "text-blue-400",   bg: "bg-blue-500/15 border-blue-500/25" },
                        medium:   { color: "text-amber-400",  bg: "bg-amber-500/15 border-amber-500/25" },
                        high:     { color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/25" },
                        critical: { color: "text-red-400",    bg: "bg-red-500/15 border-red-500/25" },
                      };
                      const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
                        reentrancy:       { zh: "重入攻擊",   en: "Reentrancy" },
                        overflow:         { zh: "整數溢位",   en: "Overflow" },
                        "access-control": { zh: "存取控制",   en: "Access Control" },
                        oracle:           { zh: "預言機操縱", en: "Oracle" },
                        logic:            { zh: "邏輯錯誤",   en: "Logic Error" },
                        other:            { zh: "其他",       en: "Other" },
                      };
                      const SEVERITY_LABELS: Record<string, { zh: string; en: string }> = {
                        low:      { zh: "低",   en: "Low" },
                        medium:   { zh: "中",   en: "Med" },
                        high:     { zh: "高",   en: "High" },
                        critical: { zh: "嚴重", en: "Crit" },
                      };
                      const sev = SEVERITY_STYLES[report.severity] ?? SEVERITY_STYLES.medium;
                      const catLabel = CATEGORY_LABELS[report.category]?.[lang] ?? report.category;
                      const sevLabel = SEVERITY_LABELS[report.severity]?.[lang] ?? report.severity;
                      const relativeTime = (() => {
                        const diff = Date.now() - new Date(report.createdAt).getTime();
                        const mins = Math.floor(diff / 60_000);
                        if (mins < 1) return lang === "zh" ? "剛剛" : "just now";
                        if (mins < 60) return lang === "zh" ? `${mins} 分鐘前` : `${mins}m ago`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return lang === "zh" ? `${hrs} 小時前` : `${hrs}h ago`;
                        const days = Math.floor(hrs / 24);
                        return lang === "zh" ? `${days} 天前` : `${days}d ago`;
                      })();

                      return (
                        <div
                          key={report.id}
                          className="p-2.5 rounded-lg bg-[oklch(0.12_0.01_265/0.6)] border border-red-500/10 space-y-1.5"
                        >
                          {/* Header: badges + timestamp */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${sev.bg} ${sev.color}`}>
                              {sevLabel}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
                              {catLabel}
                            </span>
                            <span className="ml-auto text-[9px] text-muted-foreground/60">{relativeTime}</span>
                          </div>
                          {/* Description — toggle between clamped and full */}
                          <p className={`text-[10px] text-muted-foreground leading-relaxed ${expandedReports.has(report.id) ? "" : "line-clamp-3"}`}>
                            {report.description}
                          </p>
                          {report.description.length > 120 && (
                            <button
                              onClick={() => toggleReportExpand(report.id)}
                              className="text-[9px] text-[oklch(0.51_0.24_264/0.8)] hover:text-[oklch(0.51_0.24_264)] transition-colors"
                            >
                              {expandedReports.has(report.id)
                                ? (lang === "zh" ? "收起" : "Show less")
                                : (lang === "zh" ? "展開全文" : "Read more")}
                            </button>
                          )}
                          {/* ZKP badge */}
                          <div className="flex items-center gap-1 text-[9px] text-[oklch(0.51_0.24_264/0.7)]">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            {lang === "zh" ? "零知識證明驗證" : "ZKP verified · anonymous"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* External links */}
            <div className="flex gap-2 pt-1">
              <a
                href={contract.officialDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <BookOpen className="w-3 h-3" />
                {lang === "zh" ? "官方文件" : "Official Docs"}
              </a>
              {contract.githubUrl && (
                <a
                  href={contract.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <Github className="w-3 h-3" />
                  GitHub
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface ContractRegistryProps {
  onBack: () => void;
}

export default function ContractRegistry({ onBack }: ContractRegistryProps) {
  const { lang } = useI18n();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ContractCategory | "All">("All");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "All">("All");
  const [complianceFilter, setComplianceFilter] = useState<ComplianceTag | "All">("All");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "reports">("default");
  const [lookupAddress, setLookupAddress] = useState<string | undefined>(undefined);
  const lookupPanelRef = useRef<HTMLDivElement>(null);

  // Fetch report counts for all real-address contracts when sort=reports is active
  const realAddresses = useMemo(
    () => CONTRACT_REGISTRY.filter((c) => c.address !== "0x0000000000000000000000000000000000000000").map((c) => c.address),
    []
  );
  // We batch-fetch counts only when sort is active to avoid unnecessary requests
  const reportCountQueries = realAddresses.map((addr) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    trpc.reports.count.useQuery(
      { contractAddress: addr },
      { enabled: sortBy === "reports", staleTime: 60_000 }
    )
  );
  const reportCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    realAddresses.forEach((addr, i) => {
      map[addr.toLowerCase()] = reportCountQueries[i].data?.count ?? 0;
    });
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realAddresses, ...reportCountQueries.map((q) => q.data?.count)]);

  const handleCardLookup = (address: string) => {
    setLookupAddress(address);
    // Scroll to the lookup panel
    setTimeout(() => {
      lookupPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const filtered = useMemo(() => {
    const base = filterContracts(CONTRACT_REGISTRY, query, categoryFilter, riskFilter, complianceFilter);
    if (sortBy === "reports") {
      return [...base].sort(
        (a, b) =>
          (reportCountMap[b.address.toLowerCase()] ?? 0) -
          (reportCountMap[a.address.toLowerCase()] ?? 0)
      );
    }
    return base;
  }, [query, categoryFilter, riskFilter, complianceFilter, sortBy, reportCountMap]);

  const riskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CONTRACT_REGISTRY.forEach((c) => {
      counts[c.riskLevel] = (counts[c.riskLevel] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-[oklch(0.10_0.012_265/0.95)] backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === "zh" ? "返回論壇" : "Back to Forum"}
          </button>
          <div className="flex-1">
            <h1
              className="text-base font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {lang === "zh" ? "合約登錄冊" : "Contract Registry"}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {lang === "zh"
                ? "來自受信任來源的已審計合約 · 含風險評分與合規標籤"
                : "Audited contracts from trusted sources · Risk scores · Compliance tags"}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
            {CONTRACT_REGISTRY.length} {lang === "zh" ? "份合約" : "contracts"}
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[oklch(0.75_0.18_75/0.06)] border border-[oklch(0.75_0.18_75/0.2)]">
          <AlertTriangle className="w-4 h-4 text-[oklch(0.75_0.18_75)] shrink-0 mt-0.5" />
          <p className="text-xs text-[oklch(0.75_0.18_75)] leading-relaxed">
            {lang === "zh"
              ? "本登錄冊僅供參考。審計報告不保證合約無漏洞——Euler Finance（$197M）、Nomad Bridge（$190M）均在審計後遭到攻擊。「受監管來源」是聲譽信號，不是技術安全保證。請務必從官方協議文件驗證合約地址。"
              : "This registry is for informational purposes only. Audit reports do not guarantee absence of vulnerabilities — Euler Finance ($197M) and Nomad Bridge ($190M) were both exploited post-audit. 'Regulated source' is a reputational signal, not a technical security guarantee. Always verify contract addresses from official protocol documentation."}
          </p>
        </div>

        {/* Risk summary */}
        <div className="grid grid-cols-5 gap-2">
          {(["minimal", "low", "medium", "high", "critical"] as RiskLevel[]).map((level) => {
            const cfg = RISK_CONFIG[level];
            return (
              <button
                key={level}
                onClick={() => setRiskFilter(riskFilter === level ? "All" : level)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  riskFilter === level ? "ring-1 ring-offset-1 ring-offset-background" : ""
                }`}
                style={{
                  background: cfg.bg,
                  borderColor: cfg.border,
                  ...(riskFilter === level ? { ringColor: cfg.color } : {}),
                }}
              >
                <div className="text-lg font-bold" style={{ color: cfg.color }}>
                  {riskCounts[level] || 0}
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: cfg.color }}>
                  {lang === "zh" ? cfg.label : level.toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={lang === "zh" ? "搜尋合約名稱、協議、地址..." : "Search contract name, protocol, address..."}
                className="pl-9 bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-border text-muted-foreground gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              {lang === "zh" ? "筛選" : "Filter"}
              {(categoryFilter !== "All" || complianceFilter !== "All") && (
                <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.51_0.24_264)]" />
              )}
            </Button>
            {/* Sort toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sortBy === "reports" ? "default" : "reports")}
              className={`border-border gap-1.5 transition-colors ${
                sortBy === "reports"
                  ? "border-red-500/40 text-red-400 bg-red-500/8"
                  : "text-muted-foreground"
              }`}
              title={lang === "zh" ? "依舉報數量排序" : "Sort by report count"}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {lang === "zh"
                ? sortBy === "reports" ? "舉報數↓" : "依舉報排序"
                : sortBy === "reports" ? "Reports ↓" : "Sort by reports"}
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-panel p-4 space-y-3">
                  {/* Category filter */}
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">
                      {lang === "zh" ? "類別" : "Category"}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["All", ...CATEGORIES] as (ContractCategory | "All")[]).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-full text-[10px] border transition-all ${
                            categoryFilter === cat
                              ? "bg-[oklch(0.51_0.24_264/0.2)] border-[oklch(0.51_0.24_264/0.5)] text-[oklch(0.51_0.24_264)]"
                              : "border-border text-muted-foreground hover:border-[oklch(0.51_0.24_264/0.3)]"
                          }`}
                        >
                          {cat === "All" ? (lang === "zh" ? "全部" : "All") : cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Compliance filter */}
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">
                      {lang === "zh" ? "合規標籤" : "Compliance"}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["All", "Open", "KYC/AML", "OFAC-screened", "Permissioned", "Sanctioned"] as (ComplianceTag | "All")[]).map(
                        (tag) => (
                          <button
                            key={tag}
                            onClick={() => setComplianceFilter(tag)}
                            className={`px-2.5 py-1 rounded-full text-[10px] border transition-all ${
                              complianceFilter === tag
                                ? "bg-[oklch(0.51_0.24_264/0.2)] border-[oklch(0.51_0.24_264/0.5)] text-[oklch(0.51_0.24_264)]"
                                : "border-border text-muted-foreground hover:border-[oklch(0.51_0.24_264/0.3)]"
                            }`}
                          >
                            {tag === "All" ? (lang === "zh" ? "全部" : "All") : tag}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Two-column layout: contracts list + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contract list */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                {lang === "zh"
                  ? `顯示 ${filtered.length} / ${CONTRACT_REGISTRY.length} 份合約`
                  : `Showing ${filtered.length} of ${CONTRACT_REGISTRY.length} contracts`}
                {sortBy === "reports" && reportCountQueries.some((q) => q.isLoading) && (
                  <span className="flex items-center gap-1 text-[10px] text-red-400/70">
                    <div className="w-2.5 h-2.5 border border-red-400/30 border-t-red-400/70 rounded-full animate-spin" />
                    {lang === "zh" ? "載入舉報數量..." : "Loading counts..."}
                  </span>
                )}
              </span>
              {(query || categoryFilter !== "All" || riskFilter !== "All" || complianceFilter !== "All") && (
                <button
                  onClick={() => {
                    setQuery("");
                    setCategoryFilter("All");
                    setRiskFilter("All");
                    setComplianceFilter("All");
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {lang === "zh" ? "清除篩選" : "Clear filters"}
                </button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-panel p-8 text-center"
                >
                  <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {lang === "zh" ? "找不到符合條件的合約" : "No contracts match your filters"}
                  </p>
                </motion.div>
              ) : (
                filtered.map((contract) => (
                  <ContractCard key={contract.id} contract={contract} onLookup={handleCardLookup} />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass-panel p-4" ref={lookupPanelRef}>
              <EtherscanLookupPanel
                key={lookupAddress}
                initialAddress={lookupAddress}
              />
            </div>

            {/* Stats */}
            <div className="glass-panel p-4 space-y-3">
              <h3
                className="text-xs font-semibold text-foreground"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {lang === "zh" ? "登錄冊統計" : "Registry Stats"}
              </h3>
              <div className="space-y-2">
                {[
                  { label: lang === "zh" ? "已審計合約" : "Audited contracts", value: CONTRACT_REGISTRY.filter(c => c.audits.length > 0).length },
                  { label: lang === "zh" ? "Etherscan 已驗證" : "Etherscan verified", value: CONTRACT_REGISTRY.filter(c => c.verified).length },
                  { label: lang === "zh" ? "合規/許可制" : "Compliant/Permissioned", value: CONTRACT_REGISTRY.filter(c => c.complianceTags.includes("KYC/AML") || c.complianceTags.includes("Permissioned")).length },
                  { label: lang === "zh" ? "制裁名單" : "Sanctioned", value: CONTRACT_REGISTRY.filter(c => c.complianceTags.includes("Sanctioned")).length },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                    <span className="text-xs font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources */}
            <div className="glass-panel p-4 space-y-2">
              <h3
                className="text-xs font-semibold text-foreground"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {lang === "zh" ? "資料來源" : "Data Sources"}
              </h3>
              {[
                { name: "Etherscan", url: "https://etherscan.io" },
                { name: "OpenZeppelin Audits", url: "https://www.openzeppelin.com/security-audits" },
                { name: "Aave Docs", url: "https://aave.com/docs/resources/addresses" },
                { name: "Uniswap Docs", url: "https://docs.uniswap.org/contracts/v3/reference/deployments" },
                { name: "Compound Docs", url: "https://docs.compound.finance/" },
                { name: "Chainlink Feeds", url: "https://docs.chain.link/data-feeds/price-feeds/addresses" },
              ].map(({ name, url }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  {name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
