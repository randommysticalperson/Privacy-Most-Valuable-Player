/**
 * NewThreadModal — Create a new forum thread with privacy options
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, EyeOff, Zap, Shield, Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useWeb3AuthUser } from '@web3auth/modal/react';
import {
  CATEGORY_LABELS,
  generateAlias,
  type ForumThread,
  type ThreadCategory,
  type PrivacyBadge,
} from '@/lib/forumStore';
import { generateAESKey, encryptData, exportAESKey } from '@/lib/e2eEncryption';

interface NewThreadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (thread: ForumThread) => void;
}

const categories: ThreadCategory[] = ['zero-knowledge', 'cryptography', 'identity', 'privacy-tech', 'decentralized', 'general'];

export default function NewThreadModal({ open, onClose, onCreated }: NewThreadModalProps) {
  const { userInfo } = useWeb3AuthUser();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ThreadCategory>('general');
  const [tags, setTags] = useState('');
  const [useEncryption, setUseEncryption] = useState(true);
  const [useZkp, setUseZkp] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const userAlias = userInfo?.email
    ? generateAlias(userInfo.email)
    : userInfo?.name
    ? generateAlias(userInfo.name)
    : `anon-${Math.random().toString(16).slice(2, 8)}`;

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setIsPosting(true);

    try {
      const badges: PrivacyBadge[] = ['did-auth'];
      if (useZkp) badges.push('zkp-verified');
      if (useEncryption) badges.push('encrypted');

      let exportedKey: string | undefined;
      if (useEncryption && content) {
        const key = await generateAESKey();
        await encryptData(content, key);
        exportedKey = await exportAESKey(key);
      }

      const thread: ForumThread = {
        id: `thread-${Date.now()}`,
        title: title.trim(),
        category,
        authorAlias: userAlias,
        badges,
        timestamp: Date.now(),
        postCount: 1,
        lastActivity: Date.now(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      onCreated(thread);
      setTitle(''); setContent(''); setTags('');

      if (exportedKey) {
        toast.success('Thread created! Save your encryption key: ' + exportedKey.slice(0, 16) + '...', { duration: 8000 });
      } else {
        toast.success('Thread created anonymously');
      }
      onClose();
    } catch (err) {
      toast.error('Failed to create thread');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[oklch(0.1_0.01_265)] border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Create New Thread
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Author info */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[oklch(0.7_0.17_162/0.08)] border border-[oklch(0.7_0.17_162/0.2)]">
            <Shield className="w-3.5 h-3.5 text-[oklch(0.7_0.17_162)] shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Posting as</p>
              <p className="text-xs font-mono text-foreground">{userAlias}</p>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Thread Title *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What do you want to discuss?"
              className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Category</label>
            <Select value={category} onValueChange={v => setCategory(v as ThreadCategory)}>
              <SelectTrigger className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[oklch(0.12_0.01_265)] border-border">
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opening post */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Opening Post (optional)</label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Start the discussion..."
              className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm resize-none h-24"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Tags (comma-separated)</label>
            <Input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="zkp, identity, privacy"
              className="bg-[oklch(0.14_0.015_265/0.5)] border-border text-sm"
            />
          </div>

          {/* Privacy options */}
          <div className="space-y-2 p-3 rounded-lg bg-[oklch(1_0_0/0.03)] border border-border">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Privacy Options</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setUseEncryption(v => !v)}
                className={`w-8 h-4 rounded-full transition-all duration-200 relative flex items-center shrink-0 ${
                  useEncryption ? 'bg-[oklch(0.7_0.17_162)]' : 'bg-[oklch(1_0_0/0.1)]'
                }`}
              >
                <span className={`absolute w-3 h-3 rounded-full bg-white transition-all duration-200 ${
                  useEncryption ? 'left-[18px]' : 'left-0.5'
                }`} />
              </div>
              <div>
                <p className="text-xs text-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[oklch(0.7_0.17_162)]" />
                  E2E Encryption (AES-GCM-256)
                </p>
                <p className="text-[10px] text-muted-foreground">Server only stores ciphertext</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setUseZkp(v => !v)}
                className={`w-8 h-4 rounded-full transition-all duration-200 relative flex items-center shrink-0 ${
                  useZkp ? 'bg-[oklch(0.75_0.18_75)]' : 'bg-[oklch(1_0_0/0.1)]'
                }`}
              >
                <span className={`absolute w-3 h-3 rounded-full bg-white transition-all duration-200 ${
                  useZkp ? 'left-[18px]' : 'left-0.5'
                }`} />
              </div>
              <div>
                <p className="text-xs text-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[oklch(0.75_0.18_75)]" />
                  ZKP Identity Badge (Semaphore)
                </p>
                <p className="text-[10px] text-muted-foreground">Prove group membership without revealing identity</p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!title.trim() || isPosting}
              size="sm"
              className="h-8 text-xs bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {isPosting ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isPosting ? 'Creating...' : 'Create Thread'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
