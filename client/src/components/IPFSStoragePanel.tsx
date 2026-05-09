/**
 * IPFSStoragePanel — Decentralized Storage UI
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * Demonstrates: Encrypt-then-upload to IPFS (demo mode with mock CIDs)
 */

import { useI18n } from "@/contexts/I18nContext";
import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Database, Upload, Download, Copy, Trash2, ExternalLink, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { generateAESKey, encryptData, decryptData } from "@/lib/e2eEncryption";
import { DemoIPFSStore, formatCID, type IPFSStoredItem } from "@/lib/ipfsStorage";

// Singleton demo store for this session
const demoStore = new DemoIPFSStore();

export default function IPFSStoragePanel() {
  const { t, lang } = useI18n();
  const [name, setName] = useState("my-private-note");
  const [content, setContent] = useState("This is my private data. It will be encrypted before upload.");
  const [isUploading, setIsUploading] = useState(false);
  const [items, setItems] = useState<IPFSStoredItem[]>([]);
  const [retrieving, setRetrieving] = useState<string | null>(null);
  const [retrieved, setRetrieved] = useState<Record<string, string>>({});
  const keyStore = useRef<Map<string, CryptoKey>>(new Map());

  const handleUpload = useCallback(async () => {
    if (!content.trim() || !name.trim()) return;
    setIsUploading(true);
    try {
      // 1. Generate encryption key (stays in browser)
      const key = await generateAESKey();

      // 2. Encrypt data in browser
      const encrypted = await encryptData(content, key);

      // 3. Upload ciphertext to IPFS (demo mode)
      const result = await demoStore.pin(encrypted, name);

      // 4. Store key locally (in real app: store in secure local storage or derive from wallet)
      keyStore.current.set(result.cid, key);

      // 5. Update UI
      setItems(demoStore.list());
      setName("my-private-note");
      setContent("");
      toast.success(`Uploaded to IPFS (demo) — CID: ${formatCID(result.cid)}`);
    } catch (err) {
      toast.error('上傳失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setIsUploading(false);
    }
  }, [content, name]);

  const handleRetrieve = useCallback(async (cid: string) => {
    setRetrieving(cid);
    try {
      const key = keyStore.current.get(cid);
      if (!key) throw new Error('Decryption key not found for this CID');

      const encrypted = demoStore.get(cid);
      if (!encrypted) throw new Error('CID not found in demo store');

      const plaintext = await decryptData(encrypted, key);
      setRetrieved(prev => ({ ...prev, [cid]: plaintext }));
      toast.success('Retrieved and decrypted from IPFS');
    } catch (err) {
      toast.error('取回失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setRetrieving(null);
    }
  }, []);

  const handleDelete = (cid: string) => {
    setItems(prev => prev.filter(item => item.cid !== cid));
    setRetrieved(prev => {
      const copy = { ...prev };
      delete copy[cid];
      return copy;
    });
    keyStore.current.delete(cid);
    toast.info('已從本地視圖移除（IPFS 資料不可變更）');
  };

  return (
    <div className="glass-panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[oklch(0.51_0.24_264/0.3)] text-[oklch(0.51_0.24_264)]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              IPFS 去中心化儲存
            </h3>
            <p className="text-xs text-muted-foreground">先加密再固定 · 示範模式</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs text-[oklch(0.75_0.18_75)] border-[oklch(0.75_0.18_75/0.4)]">
          Demo
        </Badge>
      </div>

      {/* Privacy model explanation */}
      <div className="p-3 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border text-xs text-muted-foreground space-y-1">
        <p className="text-foreground font-medium text-[11px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          隱私模型
        </p>
        <p>① 在瀏覽器加密 → ② 將密文上傳到 IPFS → ③ 儲存 CID（非金鑰）到伺服器</p>
        <p className="text-[oklch(0.65_0.22_25)]">⚠ 切勿直接將個人資料儲存到鏈上——區塊鏈資料不可變更且公開。</p>
      </div>

      {/* Upload form */}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">檔案名稱</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="my-private-note"
            className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">內容（將會加密）</label>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="輸入私密資料..."
            className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm resize-none h-16"
            maxLength={500}
          />
        </div>
        <Button
          onClick={handleUpload}
          disabled={!content.trim() || !name.trim() || isUploading}
          className="w-full bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {isUploading ? (
            <><Upload className="w-4 h-4 mr-2 animate-bounce" />加密並上傳中...</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" />加密並固定到 IPFS</>
          )}
        </Button>
      </div>

      {/* Stored items */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              已固定項目（{items.length}）
            </p>
            {items.map(item => (
              <motion.div
                key={item.cid}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-3 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {(item.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      onClick={() => handleDelete(item.cid)}
                      className="text-muted-foreground hover:text-[oklch(0.65_0.22_25)] transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <code className="crypto-addr text-[oklch(0.51_0.24_264)] text-[10px] flex-1">
                    {formatCID(item.cid, 10)}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(item.cid).then(() => toast.success('CID 已複製'))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${item.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Retrieved content */}
                <AnimatePresence>
                  {retrieved[item.cid] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-2 rounded bg-[oklch(0.7_0.17_162/0.08)] border border-[oklch(0.7_0.17_162/0.3)]"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3 h-3 text-[oklch(0.7_0.17_162)]" />
                        <span className="text-[10px] text-[oklch(0.7_0.17_162)]">已解密內容</span>
                      </div>
                      <p className="text-xs text-foreground">{retrieved[item.cid]}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!retrieved[item.cid] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetrieve(item.cid)}
                    disabled={retrieving === item.cid}
                    className="w-full h-7 text-xs border-border text-muted-foreground hover:text-foreground"
                  >
                    <Download className="w-3 h-3 mr-1.5" />
                    {retrieving === item.cid ? '取回中...' : '取回並解密'}
                  </Button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          尚無固定項目。請在上方上傳加密資料。
        </p>
      )}
    </div>
  );
}
