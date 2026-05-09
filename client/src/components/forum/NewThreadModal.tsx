/**
 * NewThreadModal — Create a new forum thread with privacy options
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Zap, Send, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";
import { useWeb3AuthUser } from "@/contexts/WalletContext";
import { CATEGORY_LABELS, type ForumThread, type ThreadCategory, type PrivacyBadge } from "@/lib/forumStore";
import { generateAESKey, encryptData, exportAESKey } from "@/lib/e2eEncryption";

const CATEGORIES: ThreadCategory[] = ["zero-knowledge","cryptography","identity","privacy-tech","decentralized","general"];

interface NewThreadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (thread: ForumThread) => void;
}

export default function NewThreadModal({ open, onClose, onCreated }: NewThreadModalProps) {
  const { userInfo } = useWeb3AuthUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<ThreadCategory>("general");
  const [tags, setTags] = useState("");
  const [useEncryption, setUseEncryption] = useState(true);
  const [useZkp, setUseZkp] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const alias = userInfo?.alias ?? `匿名-${Math.random().toString(16).slice(2, 8)}`;

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("請輸入標題"); return; }
    setIsPosting(true);
    try {
      const badges: PrivacyBadge[] = ["did-auth"];
      if (useZkp) badges.push("zkp-verified");
      if (useEncryption) badges.push("encrypted");

      if (useEncryption && content) {
        const key = await generateAESKey();
        await encryptData(content, key);
        const exportedKey = await exportAESKey(key);
        toast.success("討論串已加密，請保存您的金鑰：" + exportedKey.slice(0, 16) + "...", { duration: 8000 });
      }

      const thread: ForumThread = {
        id: `thread-${Date.now()}`,
        title: title.trim(),
        category,
        authorAlias: alias,
        badges,
        timestamp: Date.now(),
        postCount: 1,
        lastActivity: Date.now(),
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      };

      onCreated(thread);
      setTitle(""); setContent(""); setTags("");
      onClose();
    } catch {
      toast.error("建立討論串失敗");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[oklch(0.1_0.01_265)] border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>建立新討論串</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[oklch(0.7_0.17_162/0.08)] border border-[oklch(0.7_0.17_162/0.2)]">
            <Shield className="w-3.5 h-3.5 text-[oklch(0.7_0.17_162)] shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">發文身份</p>
              <p className="text-xs font-mono text-foreground">{alias}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">標題 *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="你想討論什麼？" className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">分類</label>
            <Select value={category} onValueChange={v => setCategory(v as ThreadCategory)}>
              <SelectTrigger className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[oklch(0.12_0.01_265)] border-border">
                {CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="text-xs">{CATEGORY_LABELS[cat]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">開筆內容（選填）</label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="開始討論..." className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm resize-none h-24" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">標籤（逗號分隔）</label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="zkp, 身份, 隱私" className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm" />
          </div>
          <div className="space-y-2 p-3 rounded-lg bg-[oklch(1_0_0/0.03)] border border-border">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">隱私選項</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setUseEncryption(v => !v)} className={`w-8 h-4 rounded-full transition-all relative flex items-center shrink-0 ${useEncryption ? "bg-[oklch(0.7_0.17_162)]" : "bg-[oklch(1_0_0/0.1)]"}`}>
                <span className={`absolute w-3 h-3 rounded-full bg-white transition-all ${useEncryption ? "left-[18px]" : "left-0.5"}`} />
              </div>
              <div>
                <p className="text-xs text-foreground flex items-center gap-1"><Lock className="w-3 h-3 text-[oklch(0.7_0.17_162)]" />端對端加密（AES-GCM-256）</p>
                <p className="text-[10px] text-muted-foreground">伺服器僅儲存密文</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setUseZkp(v => !v)} className={`w-8 h-4 rounded-full transition-all relative flex items-center shrink-0 ${useZkp ? "bg-[oklch(0.75_0.18_75)]" : "bg-[oklch(1_0_0/0.1)]"}`}>
                <span className={`absolute w-3 h-3 rounded-full bg-white transition-all ${useZkp ? "left-[18px]" : "left-0.5"}`} />
              </div>
              <div>
                <p className="text-xs text-foreground flex items-center gap-1"><Zap className="w-3 h-3 text-[oklch(0.75_0.18_75)]" />ZKP 身份徽章（Semaphore）</p>
                <p className="text-[10px] text-muted-foreground">證明群組成員身份，不暴露真實身份</p>
              </div>
            </label>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">取消</Button>
            <Button onClick={handleCreate} disabled={!title.trim() || isPosting} size="sm" className="h-8 text-xs bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {isPosting ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
              {isPosting ? "建立中..." : "建立討論串"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
