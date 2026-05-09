/**
 * SteganographyPanel — LSB Image Steganography UI
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Features:
 * - Upload or generate a carrier image
 * - Type a secret message (optionally pre-encrypted with AES)
 * - Encode message into image LSBs
 * - Download stego image
 * - Upload stego image to extract hidden message
 * - Show PSNR quality metric
 * - Show capacity indicator
 */

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ImageIcon, EyeOff, Eye, Upload, Download, RefreshCw,
  CheckCircle2, AlertCircle, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  encodeMessage,
  extractMessage,
  generateCarrierImage,
  calculateCapacity,
  calculatePSNR,
  type StegoResult,
} from "@/lib/steganography";
import { generateAESKey, encryptData, decryptData, exportAESKey, importAESKey } from "@/lib/e2eEncryption";

export default function SteganographyPanel() {
  // Encode state
  const [carrierImage, setCarrierImage] = useState<string | null>(null);
  const [secretMessage, setSecretMessage] = useState("此訊息隱藏在圖片素素中。");
  const [useEncryption, setUseEncryption] = useState(true);
  const [stegoResult, setStegoResult] = useState<StegoResult | null>(null);
  const [psnr, setPsnr] = useState<number | null>(null);
  const [isEncoding, setIsEncoding] = useState(false);
  const [exportedKey, setExportedKey] = useState<string | null>(null);

  // Decode state
  const [decodeImage, setDecodeImage] = useState<string | null>(null);
  const [decodeKey, setDecodeKey] = useState("");
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);

  const encodeFileRef = useRef<HTMLInputElement>(null);
  const decodeFileRef = useRef<HTMLInputElement>(null);

  // Generate a demo carrier image
  const handleGenerateCarrier = useCallback(() => {
    const dataUrl = generateCarrierImage(400, 280);
    setCarrierImage(dataUrl);
    setStegoResult(null);
    setPsnr(null);
    setExportedKey(null);
  }, []);

  // Handle file upload for carrier image
  const handleCarrierUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setCarrierImage(ev.target?.result as string);
      setStegoResult(null);
      setPsnr(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle file upload for decode
  const handleDecodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setDecodeImage(ev.target?.result as string);
      setDecodedMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Encode message into image
  const handleEncode = useCallback(async () => {
    if (!carrierImage || !secretMessage.trim()) return;
    setIsEncoding(true);
    setStegoResult(null);
    setPsnr(null);

    try {
      let messageToHide = secretMessage;
      let keyStr: string | null = null;

      if (useEncryption) {
        // Encrypt the message first with AES-GCM
        const key = await generateAESKey();
        const encrypted = await encryptData(secretMessage, key);
        messageToHide = JSON.stringify(encrypted);
        keyStr = await exportAESKey(key);
        setExportedKey(keyStr);
      }

      const result = await encodeMessage(carrierImage, messageToHide);
      setStegoResult(result);

      // Calculate PSNR
      const psnrValue = await calculatePSNR(carrierImage, result.imageDataUrl);
      setPsnr(psnrValue);

      toast.success(`Message hidden! PSNR: ${psnrValue.toFixed(1)} dB${useEncryption ? ' (encrypted)' : ''}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '編碼失敗');
    } finally {
      setIsEncoding(false);
    }
  }, [carrierImage, secretMessage, useEncryption]);

  // Download stego image
  const handleDownload = () => {
    if (!stegoResult) return;
    const a = document.createElement('a');
    a.href = stegoResult.imageDataUrl;
    a.download = 'stego-image.png';
    a.click();
    toast.success('隱寫圖片已下載');
  };

  // Extract message from stego image
  const handleDecode = useCallback(async () => {
    if (!decodeImage) return;
    setIsDecoding(true);
    setDecodedMessage(null);

    try {
      const result = await extractMessage(decodeImage);
      let finalMessage = result.message;

      // Try to decrypt if a key is provided
      if (decodeKey.trim()) {
        try {
          const parsed = JSON.parse(result.message);
          if (parsed.ciphertext && parsed.iv) {
            const key = await importAESKey(decodeKey.trim());
            finalMessage = await decryptData(parsed, key);
          }
        } catch {
          // Not encrypted JSON, use as-is
        }
      } else {
        // Try to parse as encrypted payload without key
        try {
          const parsed = JSON.parse(result.message);
          if (parsed.ciphertext) {
            finalMessage = '[ENCRYPTED] Provide the AES key to decrypt this message.';
          }
        } catch {
          // Plain text message
        }
      }

      setDecodedMessage(finalMessage);
      toast.success(`已從圖片提取 ${result.messageBytes} 位元組`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '提取失敗');
    } finally {
      setIsDecoding(false);
    }
  }, [decodeImage, decodeKey]);

  // Get capacity info from carrier image dimensions
  const getCapacityInfo = (dataUrl: string | null) => {
    if (!dataUrl) return null;
    const img = new Image();
    img.src = dataUrl;
    if (!img.width) return null;
    return calculateCapacity(img.width, img.height);
  };

  const psnrColor =
    psnr === null ? '' :
    psnr > 50 ? 'text-[oklch(0.7_0.17_162)]' :
    psnr > 40 ? 'text-[oklch(0.75_0.18_75)]' :
    'text-[oklch(0.65_0.22_25)]';

  return (
    <div className="glass-panel p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[oklch(0.51_0.24_264/0.3)] text-[oklch(0.51_0.24_264)]">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Steganography
            </h3>
            <p className="text-xs text-muted-foreground">LSB 圖片隱寫 · 肉眼不可見</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs text-[oklch(0.51_0.24_264)] border-[oklch(0.51_0.24_264/0.4)]">
          LSB
        </Badge>
      </div>

      {/* Explanation */}
      <div className="p-3 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border text-xs text-muted-foreground">
        <p>每個像素的 RGB 通道的<span className="text-foreground font-mono">最低有效位</span>被訊息位取代。一張 400×300 圖片可隱藏約 44 KB 的文字。圖片外觀與原圖完全相同（PSNR &gt;50 dB）。</p>
      </div>

      <Tabs defaultValue="encode">
        <TabsList className="w-full bg-[oklch(0.14_0.015_265/0.5)] border border-border">
          <TabsTrigger value="encode" className="flex-1 text-xs">
            <EyeOff className="w-3.5 h-3.5 mr-1.5" />隱藏訊息
          </TabsTrigger>
          <TabsTrigger value="decode" className="flex-1 text-xs">
            <Eye className="w-3.5 h-3.5 mr-1.5" />提取訊息
          </TabsTrigger>
        </TabsList>

        {/* ENCODE TAB */}
        <TabsContent value="encode" className="space-y-4 mt-4">
          {/* Carrier image */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">載體圖片</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCarrier}
                  className="h-7 text-xs border-border text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />生成
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => encodeFileRef.current?.click()}
                  className="h-7 text-xs border-border text-muted-foreground hover:text-foreground"
                >
                  <Upload className="w-3 h-3 mr-1" />上傳
                </Button>
                <input ref={encodeFileRef} type="file" accept="image/*" className="hidden" onChange={handleCarrierUpload} />
              </div>
            </div>

            {carrierImage ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={stegoResult?.imageDataUrl ?? carrierImage} alt="Carrier" className="w-full object-cover max-h-40" />
                {stegoResult && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-[oklch(0.7_0.17_162/0.9)] text-white text-[10px]">
                      <EyeOff className="w-2.5 h-2.5 mr-1" />訊息已隱藏
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="h-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-[oklch(0.51_0.24_264/0.5)] transition-colors"
                onClick={handleGenerateCarrier}
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">點擊生成示範圖片</p>
              </div>
            )}
          </div>

          {/* Message input */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">秘密訊息</label>
            <Textarea
              value={secretMessage}
              onChange={e => setSecretMessage(e.target.value)}
              placeholder="輸入您的秘密訊息..."
              className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm resize-none h-16"
              maxLength={5000}
            />
          </div>

          {/* Encryption toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border">
            <button
              onClick={() => setUseEncryption(v => !v)}
              className={`w-9 h-5 rounded-full transition-all duration-200 relative ${
                useEncryption ? 'bg-[oklch(0.51_0.24_264)]' : 'bg-[oklch(1_0_0/0.1)]'
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
                useEncryption ? 'left-4.5' : 'left-0.5'
              }`} />
            </button>
            <div>
              <p className="text-xs font-medium flex items-center gap-1">
                <Lock className="w-3 h-3 text-[oklch(0.51_0.24_264)]" />
                隱藏前先加密（AES-GCM-256）
              </p>
              <p className="text-[10px] text-muted-foreground">
                雙重保護：加密密文隱藏於圖片中
              </p>
            </div>
          </div>

          <Button
            onClick={handleEncode}
            disabled={!carrierImage || !secretMessage.trim() || isEncoding}
            className="w-full bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {isEncoding ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />編碼中...</>
            ) : (
              <><EyeOff className="w-4 h-4 mr-2" />將訊息隱藏到圖片</>
            )}
          </Button>

          {/* Results */}
          <AnimatePresence>
            {stegoResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'PSNR', value: psnr !== null ? `${psnr.toFixed(1)} dB` : '—', color: psnrColor },
                    { label: '容量使用', value: `${stegoResult.capacityPercent.toFixed(1)}%`, color: 'text-foreground' },
                    { label: '隱藏位元組', value: `${stegoResult.messageBytes}`, color: 'text-foreground' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-2 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border text-center">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className={`text-sm font-semibold ${color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* AES key for encrypted stego */}
                {exportedKey && (
                  <div className="p-3 rounded-lg bg-[oklch(0.75_0.18_75/0.08)] border border-[oklch(0.75_0.18_75/0.3)]">
                    <p className="text-[10px] text-[oklch(0.75_0.18_75)] mb-1 uppercase tracking-wider">AES 解密金鑰（請保存！）</p>
                    <code className="text-[10px] font-mono text-foreground break-all">{exportedKey}</code>
                  </div>
                )}

                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full border-[oklch(0.7_0.17_162/0.4)] text-[oklch(0.7_0.17_162)] hover:bg-[oklch(0.7_0.17_162/0.1)]"
                >
                  <Download className="w-4 h-4 mr-2" />下載隱寫圖片（PNG）
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* DECODE TAB */}
        <TabsContent value="decode" className="space-y-4 mt-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">隱寫圖片</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => decodeFileRef.current?.click()}
                className="h-7 text-xs border-border text-muted-foreground hover:text-foreground"
              >
                <Upload className="w-3 h-3 mr-1" />上傳
              </Button>
              <input ref={decodeFileRef} type="file" accept="image/png" className="hidden" onChange={handleDecodeUpload} />
            </div>

            {decodeImage ? (
              <img src={decodeImage} alt="Stego" className="w-full rounded-lg border border-border max-h-40 object-cover" />
            ) : (
              <div
                className="h-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-[oklch(0.51_0.24_264/0.5)] transition-colors"
                onClick={() => decodeFileRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">上傳 PNG 隱寫圖片</p>
              </div>
            )}
          </div>

          {/* Optional AES key */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">AES 解密金鑰（選填）</label>
            <input
              value={decodeKey}
              onChange={e => setDecodeKey(e.target.value)}
              placeholder="若訊息已加密，請貼上 base64 AES 金鑰..."
              className="w-full px-3 py-2 rounded-lg bg-[oklch(0.14_0.015_265/0.5)] border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[oklch(0.51_0.24_264/0.5)]"
            />
          </div>

          <Button
            onClick={handleDecode}
            disabled={!decodeImage || isDecoding}
            className="w-full bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {isDecoding ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />提取中...</>
            ) : (
              <><Eye className="w-4 h-4 mr-2" />提取隱藏訊息</>
            )}
          </Button>

          <AnimatePresence>
            {decodedMessage && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border ${
                  decodedMessage.startsWith('[ENCRYPTED]')
                    ? 'bg-[oklch(0.75_0.18_75/0.08)] border-[oklch(0.75_0.18_75/0.3)]'
                    : 'bg-[oklch(0.7_0.17_162/0.08)] border-[oklch(0.7_0.17_162/0.3)]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  {decodedMessage.startsWith('[ENCRYPTED]') ? (
                    <AlertCircle className="w-3.5 h-3.5 text-[oklch(0.75_0.18_75)]" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.7_0.17_162)]" />
                  )}
                  <span className={`text-[10px] uppercase tracking-wider ${
                    decodedMessage.startsWith('[ENCRYPTED]') ? 'text-[oklch(0.75_0.18_75)]' : 'text-[oklch(0.7_0.17_162)]'
                  }`}>
                    {decodedMessage.startsWith('[ENCRYPTED]') ? '加密訊息' : '提取的訊息'}
                  </span>
                </div>
                <p className="text-sm text-foreground">{decodedMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
