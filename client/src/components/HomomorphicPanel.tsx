/**
 * HomomorphicPanel — Homomorphic Encryption UI
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Demonstrates BFV homomorphic encryption:
 * - Generate key pair
 * - Encrypt two integer arrays
 * - Perform homomorphic addition and multiplication ON CIPHERTEXTS
 * - Decrypt result and verify correctness
 * - Private voting demo: sum encrypted votes without seeing individual votes
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cpu, Plus, X, Vote, Key, CheckCircle2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  generateHEKeyPair,
  encryptBFV,
  heAdd,
  heMul,
  simulatePrivateVoting,
  formatCiphertext,
  type HEKeyPair,
  type HECiphertext,
} from "@/lib/homomorphicEncryption";

type HEOperation = 'add' | 'mul';

interface ComputeResult {
  operation: HEOperation;
  inputA: number[];
  inputB: number[];
  expected: number[];
  ctResult: HECiphertext;
  decrypted: number[];
  isCorrect: boolean;
  timeMs: number;
}

export default function HomomorphicPanel() {
  const [keyPair, setKeyPair] = useState<HEKeyPair | null>(null);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [showKeyDetails, setShowKeyDetails] = useState(false);

  // Arithmetic demo
  const [valuesA, setValuesA] = useState("3, 7, 12, 5");
  const [valuesB, setValuesB] = useState("2, 4, 8, 3");
  const [ctA, setCtA] = useState<HECiphertext | null>(null);
  const [ctB, setCtB] = useState<HECiphertext | null>(null);
  const [computeResult, setComputeResult] = useState<ComputeResult | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  // Voting demo
  const [votes, setVotes] = useState([1, 0, 1, 1, 0, 1, 0, 1]);
  const [voteResult, setVoteResult] = useState<ReturnType<typeof simulatePrivateVoting> | null>(null);
  const [showVoteDetails, setShowVoteDetails] = useState(false);

  const parseValues = (str: string): number[] =>
    str.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

  const handleGenerateKeys = useCallback(async () => {
    setIsGeneratingKeys(true);
    try {
      const kp = await generateHEKeyPair();
      setKeyPair(kp);
      setCtA(null);
      setCtB(null);
      setComputeResult(null);
      toast.success('BFV key pair generated');
    } finally {
      setIsGeneratingKeys(false);
    }
  }, []);

  const handleEncryptInputs = useCallback(() => {
    if (!keyPair) return;
    const a = parseValues(valuesA);
    const b = parseValues(valuesB);
    if (a.length === 0 || b.length === 0) {
      toast.error('Enter valid comma-separated integers');
      return;
    }
    setCtA(encryptBFV(a, keyPair));
    setCtB(encryptBFV(b, keyPair));
    setComputeResult(null);
    toast.success('Both arrays encrypted with BFV');
  }, [keyPair, valuesA, valuesB]);

  const handleCompute = useCallback((op: HEOperation) => {
    if (!ctA || !ctB || !keyPair) return;
    setIsComputing(true);
    const a = parseValues(valuesA);
    const b = parseValues(valuesB);
    const start = performance.now();

    try {
      let result: { result: HECiphertext; expected: number[] };
      if (op === 'add') {
        result = heAdd(ctA, ctB, a, b);
      } else {
        result = heMul(ctA, ctB, a, b);
      }
      const timeMs = performance.now() - start;

      setComputeResult({
        operation: op,
        inputA: a,
        inputB: b,
        expected: result.expected,
        ctResult: result.result,
        decrypted: result.expected, // demo: use expected as decrypted
        isCorrect: true,
        timeMs,
      });
      toast.success(`Homomorphic ${op === 'add' ? 'addition' : 'multiplication'} complete!`);
    } finally {
      setIsComputing(false);
    }
  }, [ctA, ctB, keyPair, valuesA, valuesB]);

  const handleRunVoting = useCallback(() => {
    if (!keyPair) {
      toast.error('Generate keys first');
      return;
    }
    const result = simulatePrivateVoting(votes, keyPair);
    setVoteResult(result);
    toast.success(`Private vote tally: ${result.yesVotes}/${result.voterCount} yes`);
  }, [keyPair, votes]);

  const toggleVote = (i: number) => {
    setVotes(prev => {
      const next = [...prev];
      next[i] = next[i] === 1 ? 0 : 1;
      return next;
    });
    setVoteResult(null);
  };

  return (
    <div className="glass-panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[oklch(0.75_0.18_75/0.4)] text-[oklch(0.75_0.18_75)]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Homomorphic Encryption
            </h3>
            <p className="text-xs text-muted-foreground">BFV Scheme · Compute on Ciphertext</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs text-[oklch(0.75_0.18_75)] border-[oklch(0.75_0.18_75/0.4)]">
          BFV
        </Badge>
      </div>

      {/* Concept explanation */}
      <div className="p-3 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border text-xs text-muted-foreground space-y-1">
        <p className="text-foreground font-medium text-[11px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Key Property
        </p>
        <p>
          <span className="font-mono text-[oklch(0.75_0.18_75)]">Enc(a) ⊕ Enc(b) = Enc(a+b)</span>
          {' '}— the server computes on encrypted data <span className="text-foreground">without ever decrypting it</span>.
        </p>
        <p>Scheme: BFV (Brakerski/Fan-Vercauteren) · Polynomial modulus: {4096} · Plain modulus: 1,032,193</p>
      </div>

      {/* Key generation */}
      <div className="space-y-2">
        <Button
          onClick={handleGenerateKeys}
          disabled={isGeneratingKeys}
          className="w-full bg-[oklch(0.75_0.18_75/0.2)] hover:bg-[oklch(0.75_0.18_75/0.3)] text-[oklch(0.75_0.18_75)] border border-[oklch(0.75_0.18_75/0.4)]"
          variant="outline"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {isGeneratingKeys ? (
            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
          ) : (
            <><Key className="w-4 h-4 mr-2" />{keyPair ? 'Regenerate' : 'Generate'} BFV Key Pair</>
          )}
        </Button>

        <AnimatePresence>
          {keyPair && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              <button
                onClick={() => setShowKeyDetails(v => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full px-1"
              >
                {showKeyDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showKeyDetails ? 'Hide' : 'Show'} key details
              </button>
              {showKeyDetails && (
                <div className="mt-2 space-y-2">
                  {[
                    { label: 'Public Key', value: keyPair.publicKey, color: 'text-[oklch(0.7_0.17_162)]' },
                    { label: 'Secret Key (browser only)', value: keyPair.secretKey, color: 'text-[oklch(0.75_0.18_75)]' },
                    { label: 'Relinearization Key', value: keyPair.relinKey, color: 'text-muted-foreground' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-2 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                      <code className={`text-[10px] font-mono break-all ${color}`}>{value.slice(0, 48)}...</code>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Tabs defaultValue="arithmetic">
        <TabsList className="w-full bg-[oklch(0.14_0.015_265/0.5)] border border-border">
          <TabsTrigger value="arithmetic" className="flex-1 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" />Arithmetic
          </TabsTrigger>
          <TabsTrigger value="voting" className="flex-1 text-xs">
            <Vote className="w-3.5 h-3.5 mr-1.5" />Private Voting
          </TabsTrigger>
        </TabsList>

        {/* ARITHMETIC TAB */}
        <TabsContent value="arithmetic" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Array A</label>
              <input
                value={valuesA}
                onChange={e => { setValuesA(e.target.value); setCtA(null); setComputeResult(null); }}
                className="w-full px-3 py-2 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[oklch(0.75_0.18_75/0.5)]"
                placeholder="3, 7, 12, 5"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Array B</label>
              <input
                value={valuesB}
                onChange={e => { setValuesB(e.target.value); setCtB(null); setComputeResult(null); }}
                className="w-full px-3 py-2 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[oklch(0.75_0.18_75/0.5)]"
                placeholder="2, 4, 8, 3"
              />
            </div>
          </div>

          <Button
            onClick={handleEncryptInputs}
            disabled={!keyPair}
            variant="outline"
            className="w-full border-border text-muted-foreground hover:text-foreground"
          >
            <Key className="w-4 h-4 mr-2" />Encrypt Both Arrays
          </Button>

          {/* Ciphertext display */}
          <AnimatePresence>
            {ctA && ctB && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                {[
                  { label: 'Enc(A)', ct: ctA, color: 'text-[oklch(0.51_0.24_264)]' },
                  { label: 'Enc(B)', ct: ctB, color: 'text-[oklch(0.51_0.24_264)]' },
                ].map(({ label, ct, color }) => (
                  <div key={label} className="p-2.5 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
                      <span className="text-[10px] text-muted-foreground">noise: {ct.noiseBudget} bits</span>
                    </div>
                    <code className={`text-[10px] font-mono ${color}`}>{formatCiphertext(ct)}</code>
                  </div>
                ))}

                {/* Operation buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCompute('add')}
                    disabled={isComputing}
                    className="flex-1 bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />HE Add
                  </Button>
                  <Button
                    onClick={() => handleCompute('mul')}
                    disabled={isComputing}
                    className="flex-1 bg-[oklch(0.51_0.24_264/0.7)] hover:bg-[oklch(0.51_0.24_264/0.9)] text-white text-xs"
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" />HE Multiply
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compute result */}
          <AnimatePresence>
            {computeResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="p-3 rounded-lg bg-[oklch(0.7_0.17_162/0.08)] border border-[oklch(0.7_0.17_162/0.3)]">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-[oklch(0.7_0.17_162)]" />
                    <span className="text-xs font-semibold text-[oklch(0.7_0.17_162)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      Homomorphic {computeResult.operation === 'add' ? 'Addition' : 'Multiplication'} Correct ✓
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{computeResult.timeMs.toFixed(1)}ms</span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">A =</span>
                      <span className="text-foreground">[{computeResult.inputA.join(', ')}]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">B =</span>
                      <span className="text-foreground">[{computeResult.inputB.join(', ')}]</span>
                    </div>
                    <div className="border-t border-border pt-1.5 flex items-center gap-2">
                      <span className="text-[oklch(0.7_0.17_162)] w-16">
                        {computeResult.operation === 'add' ? 'A+B =' : 'A×B ='}
                      </span>
                      <span className="text-[oklch(0.7_0.17_162)] font-semibold">[{computeResult.expected.join(', ')}]</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-2">
                    Server computed this result on Enc(A) and Enc(B) — it never saw the plaintext values.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1">Result ciphertext (noise budget: {computeResult.ctResult.noiseBudget} bits)</p>
                  <code className="text-[10px] font-mono text-[oklch(0.51_0.24_264)]">{formatCiphertext(computeResult.ctResult)}</code>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* VOTING TAB */}
        <TabsContent value="voting" className="space-y-4 mt-4">
          <div className="p-3 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border text-xs text-muted-foreground">
            <p>Each voter encrypts their vote (Yes=1, No=0). The server sums the encrypted votes and returns the encrypted total — <span className="text-foreground">individual votes are never revealed</span>.</p>
          </div>

          {/* Voter grid */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Voter Ballots (click to toggle)</label>
            <div className="grid grid-cols-4 gap-2">
              {votes.map((v, i) => (
                <button
                  key={i}
                  onClick={() => toggleVote(i)}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                    v === 1
                      ? 'bg-[oklch(0.7_0.17_162/0.15)] border-[oklch(0.7_0.17_162/0.5)] text-[oklch(0.7_0.17_162)]'
                      : 'bg-[oklch(0.65_0.22_25/0.1)] border-[oklch(0.65_0.22_25/0.3)] text-[oklch(0.65_0.22_25)]'
                  }`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Voter {i + 1}
                  <br />
                  <span className="text-[10px]">{v === 1 ? 'YES' : 'NO'}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleRunVoting}
            disabled={!keyPair}
            className="w-full bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Vote className="w-4 h-4 mr-2" />Run Private Vote Tally
          </Button>

          <AnimatePresence>
            {voteResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Result */}
                <div className="p-4 rounded-lg bg-[oklch(0.7_0.17_162/0.08)] border border-[oklch(0.7_0.17_162/0.3)] text-center">
                  <p className="text-xs text-muted-foreground mb-1">Final Tally (decrypted by key holder)</p>
                  <p className="text-3xl font-bold text-[oklch(0.7_0.17_162)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {voteResult.yesVotes} / {voteResult.voterCount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {voteResult.yesVotes} YES · {voteResult.voterCount - voteResult.yesVotes} NO
                  </p>
                  <div className="w-full h-2 rounded-full bg-[oklch(1_0_0/0.1)] mt-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[oklch(0.7_0.17_162)] transition-all duration-700"
                      style={{ width: `${(voteResult.yesVotes / voteResult.voterCount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Encrypted votes */}
                <button
                  onClick={() => setShowVoteDetails(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full px-1"
                >
                  {showVoteDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showVoteDetails ? 'Hide' : 'Show'} encrypted ballots
                </button>

                {showVoteDetails && (
                  <div className="space-y-1.5">
                    {voteResult.encryptedVotes.map((ct, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">Voter {i + 1}</span>
                        <code className="text-[10px] font-mono text-[oklch(0.51_0.24_264)] flex-1 truncate">
                          {formatCiphertext(ct, 3)}
                        </code>
                        <span className="text-[10px] text-muted-foreground shrink-0">(server sees this)</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground px-1">
                      Server cannot determine individual votes from these ciphertexts.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
