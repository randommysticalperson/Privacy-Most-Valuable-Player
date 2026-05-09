/**
 * ThreadView — Thread detail view with encrypted reply composer
 * i18n: all labels via useI18n()
 */

import { useState } from "react";
import { ArrowLeft, Lock, Eye, Send, Heart, Copy, RefreshCw, Zap, Database, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useWeb3AuthUser, useWeb3AuthConnect } from "@/contexts/WalletContext";
import { useI18n } from "@/contexts/I18nContext";
import { generateAESKey, encryptData, exportAESKey } from "@/lib/e2eEncryption";
import { generateCarrierImage, encodeMessage } from "@/lib/steganography";
import { SEED_POSTS, formatRelativeTime, type ForumThread, type ForumPost, type PrivacyBadge } from "@/lib/forumStore";

const BADGE_CONFIG: Record<PrivacyBadge, { icon: React.ElementType; color: string; label: string }> = {
  "zkp-verified": { icon: Zap,      color: "oklch(0.75 0.18 75)",  label: "ZKP" },
  "encrypted":    { icon: Lock,     color: "oklch(0.7 0.17 162)",  label: "E2E" },
  "ipfs-stored":  { icon: Database, color: "oklch(0.51 0.24 264)", label: "IPFS" },
  "did-auth":     { icon: Shield,   color: "oklch(0.51 0.24 264)", label: "DID" },
  "stego":        { icon: Eye,      color: "oklch(0.7 0.17 162)",  label: "Stego" },
};

interface ThreadViewProps {
  thread: ForumThread;
  onBack: () => void;
  extraPosts: ForumPost[];
  onPostAdded: (post: ForumPost) => void;
}

export default function ThreadView({ thread, onBack, extraPosts, onPostAdded }: ThreadViewProps) {
  const { userInfo, isConnected } = useWeb3AuthUser();
  const { connect } = useWeb3AuthConnect();
  const { t, lang } = useI18n();
  const [content, setContent] = useState("");
  const [useEncryption, setUseEncryption] = useState(true);
  const [useStego, setUseStego] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const seedPosts = SEED_POSTS.filter(p => p.threadId === thread.id);
  const threadExtraPosts = extraPosts.filter(p => p.threadId === thread.id);
  const allPosts = [...seedPosts, ...threadExtraPosts];

  const handlePost = async () => {
    if (!content.trim()) return;
    setIsPosting(true);
    try {
      const badges: PrivacyBadge[] = ["did-auth"];
      let encryptedContent: string | undefined;
      let stegoImage: string | undefined;

      if (useEncryption) {
        badges.push("encrypted");
        const key = await generateAESKey();
        const payload = await encryptData(content, key);
        encryptedContent = payload.ciphertext;
        const exportedKey = await exportAESKey(key);
        toast.success(
          (lang === "zh" ? "帖子已加密，請保存您的金鑰：" : "Post encrypted. Save your key: ") + exportedKey.slice(0, 16) + "...",
          { duration: 8000 }
        );
      }

      if (useStego) {
        badges.push("stego");
        const carrier = generateCarrierImage(200, 150);
        const result = await encodeMessage(carrier, content.slice(0, 100));
        stegoImage = result.imageDataUrl;
      }

      const post: ForumPost = {
        id: `post-${Date.now()}`,
        threadId: thread.id,
        authorAlias: userInfo?.alias ?? "anon",
        content: useEncryption
          ? (lang === "zh" ? "[已加密內容 — 需要金鑰才能解密]" : "[Encrypted content — key required to decrypt]")
          : content,
        encryptedContent,
        stegoImage,
        badges,
        timestamp: Date.now(),
        likes: 0,
      };

      onPostAdded(post);
      setContent("");
      if (!useEncryption) toast.success(lang === "zh" ? "匿名回覆已發布" : "Anonymous reply posted");
    } catch (err) {
      toast.error(lang === "zh" ? "發布回覆失敗" : "Failed to post reply");
    } finally {
      setIsPosting(false);
    }
  };

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {lang === "zh" ? "返回討論串列表" : "Back to threads"}
      </button>

      <div className="p-4 rounded-xl border border-[oklch(0.51_0.24_264/0.25)] bg-[oklch(0.51_0.24_264/0.06)]">
        <h1 className="text-base font-semibold text-foreground leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {thread.title}
        </h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[10px] font-mono text-muted-foreground">{thread.authorAlias}</span>
          {thread.badges.map(badge => {
            const cfg = BADGE_CONFIG[badge];
            return (
              <span key={badge} className="text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-0.5"
                style={{ color: cfg.color, borderColor: `${cfg.color}40` }}>
                <cfg.icon className="w-2.5 h-2.5" />{cfg.label}
              </span>
            );
          })}
          {thread.tags.map(tag => (
            <span key={tag} className="text-[10px] text-muted-foreground">{tag}</span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {allPosts.map(post => (
          <div key={post.id} className="p-4 rounded-xl border border-border bg-[oklch(0.11_0.01_265/0.5)]">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[oklch(0.51_0.24_264/0.2)] border border-[oklch(0.51_0.24_264/0.4)] flex items-center justify-center">
                  <span className="text-[9px] font-bold text-[oklch(0.51_0.24_264)]">
                    {post.authorAlias.slice(0, 1).toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">{post.authorAlias}</span>
                <span className="text-[10px] text-muted-foreground">{formatRelativeTime(post.timestamp)}</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {post.badges.map(badge => {
                  const cfg = BADGE_CONFIG[badge];
                  return (
                    <span key={badge} className="text-[9px] px-1 py-0.5 rounded border flex items-center gap-0.5"
                      style={{ color: cfg.color, borderColor: `${cfg.color}40` }}>
                      <cfg.icon className="w-2 h-2" />{cfg.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

            {post.encryptedContent && (
              <div className="mt-2 p-2 rounded-lg bg-[oklch(0.7_0.17_162/0.06)] border border-[oklch(0.7_0.17_162/0.2)]">
                <p className="text-[10px] font-mono text-[oklch(0.7_0.17_162)] truncate">{post.encryptedContent.slice(0, 40)}...</p>
              </div>
            )}

            {post.stegoImage && (
              <div className="mt-2">
                <img src={post.stegoImage} alt="stego" className="w-24 h-18 rounded-lg border border-border object-cover" />
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {lang === "zh" ? "附件隱寫圖片" : "Stego attachment"}
                </p>
              </div>
            )}

            {post.ipfsCid && (
              <p className="text-[9px] font-mono text-muted-foreground mt-1">IPFS: {post.ipfsCid}</p>
            )}

            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1 text-[11px] transition-colors ${likedPosts.has(post.id) ? "text-[oklch(0.65_0.22_25)]" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Heart className={`w-3.5 h-3.5 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(post.content); toast.success(lang === "zh" ? "已複製" : "Copied"); }}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {lang === "zh" ? "複製" : "Copy"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {isConnected ? (
        <div className="p-4 rounded-xl border border-border bg-[oklch(0.11_0.01_265/0.5)] space-y-3">
          <p className="text-xs font-medium text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {lang === "zh" ? "以" : "Reply as"}{" "}
            <span className="font-mono text-[oklch(0.7_0.17_162)]">{userInfo?.alias}</span>
            {lang === "zh" ? " 的身份回覆" : ""}
          </p>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={t("replyPlaceholder")}
            className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm resize-none h-24"
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setUseEncryption(v => !v)}
                className={`w-7 h-3.5 rounded-full transition-all relative flex items-center ${useEncryption ? "bg-[oklch(0.7_0.17_162)]" : "bg-[oklch(1_0_0/0.1)]"}`}>
                <span className={`absolute w-2.5 h-2.5 rounded-full bg-white transition-all ${useEncryption ? "left-[14px]" : "left-0.5"}`} />
              </div>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" />{t("e2eEncrypt")}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setUseStego(v => !v)}
                className={`w-7 h-3.5 rounded-full transition-all relative flex items-center ${useStego ? "bg-[oklch(0.51_0.24_264)]" : "bg-[oklch(1_0_0/0.1)]"}`}>
                <span className={`absolute w-2.5 h-2.5 rounded-full bg-white transition-all ${useStego ? "left-[14px]" : "left-0.5"}`} />
              </div>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Eye className="w-3 h-3" />{t("stegoHide")}
              </span>
            </label>
            <div className="flex-1" />
            <Button
              onClick={handlePost}
              disabled={!content.trim() || isPosting}
              size="sm"
              className="h-7 text-xs bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white"
            >
              {isPosting ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
              {isPosting ? t("submitting") : t("reply")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-border text-center space-y-2">
          <p className="text-xs text-muted-foreground">{t("connectToReply")}</p>
          <Button onClick={connect} size="sm" variant="outline" className="h-7 text-xs border-[oklch(0.51_0.24_264/0.4)] text-[oklch(0.51_0.24_264)]">
            {t("connectWallet")}
          </Button>
        </div>
      )}
    </div>
  );
}
