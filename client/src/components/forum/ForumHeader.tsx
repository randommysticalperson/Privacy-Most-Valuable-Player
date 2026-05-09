/**
 * ForumHeader — Top navigation bar for ZeroForum
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Integrates MetaMask Embedded Wallets SDK via @web3auth/modal/react hooks:
 * - useWeb3AuthConnect: { connect, isConnected, loading }
 * - useWeb3AuthDisconnect: { disconnect }
 * - useWeb3AuthUser: { userInfo }
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Shield, Wallet, LogOut, User, Copy, CheckCircle2, ChevronDown, Loader2, Bell, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from '@web3auth/modal/react';
import { generateAlias } from '@/lib/forumStore';

interface ForumHeaderProps {
  onNewThread: () => void;
}

export default function ForumHeader({ onNewThread }: ForumHeaderProps) {
  const { connect, isConnected, loading: connectLoading } = useWeb3AuthConnect();
  const { disconnect, loading: disconnectLoading } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const [copied, setCopied] = useState(false);

  const isLoading = connectLoading || disconnectLoading;

  // Derive alias from user info
  const userAlias = userInfo?.email
    ? generateAlias(userInfo.email)
    : userInfo?.name
    ? generateAlias(userInfo.name)
    : 'anon-user';

  const handleConnect = async () => {
    try {
      await connect();
      toast.success('Wallet connected via MetaMask Embedded SDK');
    } catch (err) {
      toast.error('Connection failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Disconnected');
    } catch (err) {
      toast.error('Disconnect failed');
    }
  };

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(userAlias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Alias copied');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[oklch(0.08_0.01_265/0.9)] backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: logo (mobile) + search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Shield className="w-5 h-5 text-[oklch(0.51_0.24_264)]" />
            <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Zero<span className="text-[oklch(0.51_0.24_264)]">Forum</span>
            </span>
          </div>

          {/* Search bar */}
          <div className="hidden sm:flex items-center gap-2 flex-1 max-w-xs h-8 px-3 rounded-lg bg-[oklch(1_0_0/0.05)] border border-border text-muted-foreground text-xs">
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>Search threads...</span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* New thread button */}
          {isConnected && (
            <Button
              onClick={onNewThread}
              size="sm"
              className="h-8 text-xs bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white hidden sm:flex"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              + New Thread
            </Button>
          )}

          {/* Notifications placeholder */}
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)] transition-colors">
            <Bell className="w-4 h-4" />
          </button>

          {/* Wallet connect / user menu */}
          <AnimatePresence mode="wait">
            {!isConnected ? (
              <motion.div key="connect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  size="sm"
                  className="h-8 text-xs bg-[oklch(0.51_0.24_264/0.15)] hover:bg-[oklch(0.51_0.24_264/0.25)] text-[oklch(0.51_0.24_264)] border border-[oklch(0.51_0.24_264/0.4)]"
                  variant="outline"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Wallet className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              </motion.div>
            ) : (
              <motion.div key="user" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 h-8 px-3 rounded-lg bg-[oklch(0.7_0.17_162/0.1)] border border-[oklch(0.7_0.17_162/0.3)] text-xs text-[oklch(0.7_0.17_162)] hover:bg-[oklch(0.7_0.17_162/0.15)] transition-colors">
                      <div className="w-5 h-5 rounded-full bg-[oklch(0.7_0.17_162/0.2)] flex items-center justify-center">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="font-mono hidden sm:block">{userAlias}</span>
                      <Badge className="bg-[oklch(0.7_0.17_162/0.2)] text-[oklch(0.7_0.17_162)] text-[9px] px-1 py-0 hidden sm:block">
                        ZKP
                      </Badge>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[oklch(0.12_0.01_265)] border-border">
                    <div className="px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">Anonymous Identity</p>
                      <p className="text-xs font-mono text-foreground mt-0.5">{userAlias}</p>
                      {userInfo?.email && (
                        <p className="text-[10px] text-muted-foreground mt-1">{userInfo.email}</p>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={handleCopyAlias}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-[oklch(0.7_0.17_162)]" /> : <Copy className="w-3.5 h-3.5 mr-2" />}
                      Copy alias
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={handleDisconnect}
                      className="text-xs text-destructive hover:text-destructive cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
