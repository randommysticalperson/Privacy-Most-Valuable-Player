/**
 * ZKPProofPanel — Semaphore Zero-Knowledge Proof UI
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * Shows: group membership proof generation and verification
 */

import { useState } from "react";
import { useSemaphore } from "@/contexts/SemaphoreContext";
import { useWallet } from "@/contexts/WalletContext";
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

  const [message, setMessage] = useState("I am a verified member");
  const [showProofDetails, setShowProofDetails] = useState(false);

  const isGenerating = ['building-group', 'generating-proof', 'verifying'].includes(status);

  const statusLabel = {
    idle: identityInfo ? 'Ready to Prove' : 'Awaiting Identity',
    'creating-identity': 'Creating Identity...',
    'building-group': 'Building Merkle Tree...',
    'generating-proof': 'Generating ZKP...',
    verifying: 'Verifying Proof...',
    verified: 'Proof Verified',
    failed: 'Proof Failed',
  }[status];

  const handleGenerate = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message to prove');
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
            <span className="text-[oklch(0.7_0.17_162)]">Your node is hidden in the tree</span>
          ) : (
            `${groupSize} members in group`
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
              Semaphore ZKP
            </h3>
            <p className="text-xs text-muted-foreground">Anonymous Group Membership Proof</p>
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
          <span className="text-xs text-muted-foreground">Group Merkle Tree ({groupSize} members)</span>
        </div>
        {renderMerkleTree()}
      </div>

      {/* Not connected */}
      {!isConnected && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Connect your wallet first to create a Semaphore identity
        </p>
      )}

      {/* Ready to prove */}
      {isConnected && identityInfo && status !== 'verified' && !isGenerating && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Anonymous Message</label>
            <Input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter your anonymous message..."
              className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm font-mono"
              maxLength={64}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              This message is included in the proof but cannot be linked to your identity
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!message.trim()}
            className="w-full bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Generate ZKP Proof
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
              {status === 'building-group' && 'Constructing Merkle tree from group members...'}
              {status === 'generating-proof' && 'Running Groth16 circuit — this may take a moment...'}
              {status === 'verifying' && 'Verifying proof validity locally...'}
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
                  {proofResult.isValid ? 'Proof Valid ✓' : 'Proof Invalid ✗'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Membership proved without revealing identity
                </p>
              </div>
            </div>

            {/* Key proof fields */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
                <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">Nullifier (anti-double-signal)</p>
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
              {showProofDetails ? 'Hide' : 'Show'} Groth16 proof points
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
              Generate New Proof
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
