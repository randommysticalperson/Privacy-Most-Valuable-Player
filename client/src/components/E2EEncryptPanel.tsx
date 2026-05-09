/**
 * E2EEncryptPanel — 端對端加密 UI
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * Demonstrates: AES-GCM encryption/decryption with WebCrypto API
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Key, Copy, RefreshCw, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  generateAESKey,
  exportAESKey,
  encryptData,
  decryptData,
  truncateB64,
  type EncryptedPayload,
} from "@/lib/e2eEncryption";

export default function E2EEncryptPanel() {
  const [plaintext, setPlaintext] = useState("Hello, this is my private message. The server will never see this.");
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedPayload | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [keyB64, setKeyB64] = useState<string | null>(null);
  const [aesKey, setAesKey] = useState<CryptoKey | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleEncrypt = useCallback(async () => {
    if (!plaintext.trim()) return;
    setIsEncrypting(true);
    setDecryptedText(null);
    try {
      // Generate a fresh AES key for this session
      const key = await generateAESKey();
      const exported = await exportAESKey(key);
      setAesKey(key);
      setKeyB64(exported);

      // Encrypt in the browser — server never sees plaintext
      const payload = await encryptData(plaintext, key);
      setEncryptedPayload(payload);
      toast.success('已在瀏覽器加密——伺服器僅能看到密文');
    } catch (err) {
      toast.error('加密失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setIsEncrypting(false);
    }
  }, [plaintext]);

  const handleDecrypt = useCallback(async () => {
    if (!encryptedPayload || !aesKey) return;
    setIsDecrypting(true);
    try {
      const text = await decryptData(encryptedPayload, aesKey);
      setDecryptedText(text);
      toast.success('已使用本地金鑰成功解密');
    } catch (err) {
      toast.error('解密失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setIsDecrypting(false);
    }
  }, [encryptedPayload, aesKey]);

  const handleReset = () => {
    setEncryptedPayload(null);
    setDecryptedText(null);
    setKeyB64(null);
    setAesKey(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} 已複製`);
  };

  return (
    <div className="glass-panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
            encryptedPayload
              ? 'border-[oklch(0.7_0.17_162/0.5)] text-[oklch(0.7_0.17_162)] bg-[oklch(0.7_0.17_162/0.1)]'
              : 'border-[oklch(0.51_0.24_264/0.3)] text-[oklch(0.51_0.24_264)]'
          }`}>
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              端對端加密
            </h3>
            <p className="text-xs text-muted-foreground">WebCrypto API · AES-GCM-256</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs text-muted-foreground border-border">
          僅瀏覽器端
        </Badge>
      </div>

      {/* Architecture diagram */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border text-[10px]">
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.75_0.18_75/0.2)] border border-[oklch(0.75_0.18_75/0.4)] flex items-center justify-center mb-1 mx-auto">
            <span className="text-[oklch(0.75_0.18_75)]">📝</span>
          </div>
          <span className="text-[oklch(0.75_0.18_75)]">明文</span>
          <br/><span className="text-muted-foreground">（瀏覽器）</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <ArrowRight className="w-4 h-4 text-[oklch(0.51_0.24_264)]" />
          <span className="text-[oklch(0.51_0.24_264)]">AES-GCM</span>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.51_0.24_264/0.2)] border border-[oklch(0.51_0.24_264/0.4)] flex items-center justify-center mb-1 mx-auto">
            <span>🔒</span>
          </div>
          <span className="text-[oklch(0.51_0.24_264)]">密文</span>
          <br/><span className="text-muted-foreground">（伺服器/IPFS）</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <ArrowRight className="w-4 h-4 text-[oklch(0.7_0.17_162)]" />
          <span className="text-[oklch(0.7_0.17_162)]">解密</span>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.7_0.17_162/0.2)] border border-[oklch(0.7_0.17_162/0.4)] flex items-center justify-center mb-1 mx-auto">
            <span className="text-[oklch(0.7_0.17_162)]">📝</span>
          </div>
          <span className="text-[oklch(0.7_0.17_162)]">明文</span>
          <br/><span className="text-muted-foreground">（瀏覽器）</span>
        </div>
      </div>

      {/* Input */}
      {!encryptedPayload && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">明文訊息</label>
            <Textarea
              value={plaintext}
              onChange={e => setPlaintext(e.target.value)}
              placeholder="輸入要加密的文字..."
              className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm resize-none h-20"
              maxLength={1000}
            />
          </div>
          <Button
            onClick={handleEncrypt}
            disabled={!plaintext.trim() || isEncrypting}
            className="w-full bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {isEncrypting ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />加密中...</>
            ) : (
              <><Lock className="w-4 h-4 mr-2" />在瀏覽器中加密</>
            )}
          </Button>
        </div>
      )}

      {/* Encrypted result */}
      <AnimatePresence>
        {encryptedPayload && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* AES Key */}
            {keyB64 && (
              <div className="p-3 rounded-lg bg-[oklch(0.75_0.18_75/0.08)] border border-[oklch(0.75_0.18_75/0.25)]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[oklch(0.75_0.18_75)]" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">AES-256 金鑰（僅限瀏覽器）</span>
                  </div>
                  <button onClick={() => copyToClipboard(keyB64, 'Key')}>
                    <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
                <code className="crypto-addr text-[oklch(0.85_0.005_265)] text-[10px] break-all">
                  {truncateB64(keyB64, 12)}
                </code>
                <p className="text-[10px] text-muted-foreground mt-1">
                  此金鑰永遠不會離開您的瀏覽器。伺服器無法在沒有它的情況下解密。
                </p>
              </div>
            )}

            {/* Ciphertext */}
            <div className="p-3 rounded-lg bg-[oklch(0.51_0.24_264/0.08)] border border-[oklch(0.51_0.24_264/0.25)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">密文（伺服器儲存此內容）</span>
                <button onClick={() => copyToClipboard(encryptedPayload.ciphertext, 'Ciphertext')}>
                  <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <code className="crypto-addr text-[oklch(0.85_0.005_265)] text-[10px] break-all">
                {truncateB64(encryptedPayload.ciphertext, 16)}
              </code>
            </div>

            {/* IV */}
            <div className="p-3 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">IV / Nonce（12 位元組，隨機）</span>
              </div>
              <code className="crypto-addr text-muted-foreground text-[10px]">
                {encryptedPayload.iv}
              </code>
            </div>

            {/* Algorithm info */}
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground px-1">
              <span>演算法：<span className="text-foreground">{encryptedPayload.algorithm}</span></span>
              <span>大小：<span className="text-foreground">{encryptedPayload.ciphertext.length} 字元</span></span>
            </div>

            {/* Decrypted result */}
            <AnimatePresence>
              {decryptedText !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-[oklch(0.7_0.17_162/0.08)] border border-[oklch(0.7_0.17_162/0.3)]"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Unlock className="w-3.5 h-3.5 text-[oklch(0.7_0.17_162)]" />
                    <span className="text-[10px] text-[oklch(0.7_0.17_162)] uppercase tracking-wider">已解密（僅限瀏覽器）</span>
                  </div>
                  <p className="text-sm text-foreground">{decryptedText}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-2">
              {!decryptedText && (
                <Button
                  onClick={handleDecrypt}
                  disabled={isDecrypting}
                  className="flex-1 bg-[oklch(0.7_0.17_162/0.2)] hover:bg-[oklch(0.7_0.17_162/0.3)] text-[oklch(0.7_0.17_162)] border border-[oklch(0.7_0.17_162/0.3)]"
                  variant="outline"
                >
                  {isDecrypting ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />解密中...</>
                  ) : (
                    <><Unlock className="w-4 h-4 mr-2" />解密</>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-border text-muted-foreground hover:text-foreground"
                size={decryptedText ? 'default' : 'icon'}
              >
                <RefreshCw className="w-4 h-4" />
                {decryptedText && <span className="ml-2">重置</span>}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
