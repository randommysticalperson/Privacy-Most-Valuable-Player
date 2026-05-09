/**
 * DPAnalyticsPanel — 差分隱私 Analytics UI
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * Demonstrates: Laplace mechanism noise injection for page view statistics
 */

import { useI18n } from "@/contexts/I18nContext";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart2, RefreshCw, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  simulateDPAnalytics,
  expectedNoiseMagnitude,
  PrivacyBudgetTracker,
  type PageViewStats,
} from "@/lib/differentialPrivacy";

const budgetTracker = new PrivacyBudgetTracker(10.0);

export default function DPAnalyticsPanel() {
  const { t, lang } = useI18n();
  const [epsilon, setEpsilon] = useState(1.0);
  const [stats, setStats] = useState<PageViewStats[] | null>(null);
  const [budgetStatus, setBudgetStatus] = useState(budgetTracker.getStatus());
  const [showRaw, setShowRaw] = useState(false);

  const handleRunAnalytics = useCallback(() => {
    if (!budgetTracker.canQuery(epsilon)) {
      return;
    }
    budgetTracker.recordQuery('page-views', epsilon);
    const result = simulateDPAnalytics(epsilon);
    setStats(result.dp);
    setBudgetStatus(budgetTracker.getStatus());
  }, [epsilon]);

  const handleReset = () => {
    budgetTracker.reset();
    setStats(null);
    setBudgetStatus(budgetTracker.getStatus());
  };

  const noiseInfo = expectedNoiseMagnitude(epsilon);

  const privacyLabel =
    epsilon <= 0.5 ? { label: 'Very High Privacy', color: 'text-[oklch(0.7_0.17_162)]', border: 'border-[oklch(0.7_0.17_162/0.4)]' } :
    epsilon <= 1.0 ? { label: 'High Privacy', color: 'text-[oklch(0.7_0.17_162)]', border: 'border-[oklch(0.7_0.17_162/0.4)]' } :
    epsilon <= 2.0 ? { label: 'Medium Privacy', color: 'text-[oklch(0.75_0.18_75)]', border: 'border-[oklch(0.75_0.18_75/0.4)]' } :
    { label: 'Low Privacy', color: 'text-[oklch(0.65_0.22_25)]', border: 'border-[oklch(0.65_0.22_25/0.4)]' };

  const chartData = stats?.map(s => ({
    name: s.page.replace('/', '').replace('-', ' ') || 'home',
    true: s.trueCount,
    dp: s.dpCount,
    diff: Math.abs(s.dpCount - s.trueCount),
  }));

  return (
    <div className="glass-panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[oklch(0.51_0.24_264/0.3)] text-[oklch(0.51_0.24_264)]">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              差分隱私
            </h3>
            <p className="text-xs text-muted-foreground">Laplace 機制 · 頁面瀏覽分析</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${privacyLabel.color} ${privacyLabel.border}`}
        >
          {privacyLabel.label}
        </Badge>
      </div>

      {/* Epsilon slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">
            隱私預算（ε = {epsilon.toFixed(1)}）
          </label>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>ε 越小 = 隱私性越高</span>
          </div>
        </div>
        <Slider
          min={0.1}
          max={5.0}
          step={0.1}
          value={[epsilon]}
          onValueChange={([v]) => setEpsilon(v)}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0.1（極高隱私）</span>
          <span>5.0（低隱私）</span>
        </div>

        {/* Noise magnitude info */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: '預期噪音', value: `±${noiseInfo.expectedAbsNoise.toFixed(1)}` },
            { label: '標準差', value: noiseInfo.stddev.toFixed(1) },
            { label: '尺度（b）', value: (1 / epsilon).toFixed(2) },
          ].map(({ label, value }) => (
            <div key={label} className="p-2 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy budget tracker */}
      <div className="p-3 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">已使用隱私預算</span>
          <span className="text-xs font-mono">
            {budgetStatus.usedBudget.toFixed(1)} / {budgetStatus.totalBudget.toFixed(1)} ε
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[oklch(1_0_0/0.1)] overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetStatus.percentUsed > 80 ? 'bg-[oklch(0.65_0.22_25)]' :
              budgetStatus.percentUsed > 50 ? 'bg-[oklch(0.75_0.18_75)]' :
              'bg-[oklch(0.7_0.17_162)]'
            }`}
            style={{ width: `${Math.min(budgetStatus.percentUsed, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {budgetStatus.queryCount} 次查詢 · 剩餘 {budgetStatus.remainingBudget.toFixed(1)} ε
        </p>
      </div>

      {/* Run button */}
      <div className="flex gap-2">
        <Button
          onClick={handleRunAnalytics}
          disabled={!budgetTracker.canQuery(epsilon)}
          className="flex-1 bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <BarChart2 className="w-4 h-4 mr-2" />
          執行差分隱私分析（ε={epsilon.toFixed(1)}）
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          className="border-border text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {!budgetTracker.canQuery(epsilon) && (
        <p className="text-xs text-[oklch(0.65_0.22_25)] text-center">
          隱私預算已耗盡。請重置後繼續。
        </p>
      )}

      {/* Chart */}
      <AnimatePresence>
        {stats && chartData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">頁面瀏覽統計</p>
              <button
                onClick={() => setShowRaw(v => !v)}
                className="text-[10px] text-[oklch(0.51_0.24_264)] hover:underline"
              >
                {showRaw ? '顯示 DP 數字' : '與真實數字比較'}
              </button>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -10 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: 'oklch(0.6 0.01 265)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'oklch(0.6 0.01 265)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'oklch(0.14 0.015 265 / 0.95)',
                      border: '1px solid oklch(1 0 0 / 0.1)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: 'oklch(0.93 0.005 265)',
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'dp' ? 'DP 計數' : name === 'true' ? '真實計數' : '噪音',
                    ]}
                  />
                  {showRaw && (
                    <Bar dataKey="true" radius={[3, 3, 0, 0]} fill="oklch(0.6 0.01 265 / 0.4)" />
                  )}
                  <Bar dataKey="dp" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={`oklch(0.51 0.24 264 / ${0.5 + (entry.dp / 1500) * 0.5})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats table */}
            <div className="space-y-1">
              {stats.map(s => {
                const noise = s.dpCount - s.trueCount;
                return (
                  <div key={s.page} className="flex items-center justify-between text-[10px] px-1">
                    <code className="text-muted-foreground w-28 truncate">{s.page}</code>
                    <span className="text-foreground w-12 text-right">{s.trueCount}</span>
                    <span className="text-[oklch(0.51_0.24_264)] w-12 text-right">{s.dpCount}</span>
                    <span className={`w-14 text-right ${noise > 0 ? 'text-[oklch(0.7_0.17_162)]' : 'text-[oklch(0.65_0.22_25)]'}`}>
                      {noise > 0 ? '+' : ''}{noise}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between text-[10px] px-1 pt-1 border-t border-border text-muted-foreground">
                <span className="w-28">頁面</span>
                <span className="w-12 text-right">真實</span>
                <span className="w-12 text-right text-[oklch(0.51_0.24_264)]">DP</span>
                <span className="w-14 text-right">噪音</span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              差分隱私統計無法識別個別使用者。噪音機制即使在輔助資料下也能防止重新識別。
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
