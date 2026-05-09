/**
 * ForumHeader — Top navigation bar for ZeroForum
 * Uses WalletContext hooks (native MetaMask, no Web3Auth cloud dependency)
 * i18n: 繁體中文 / English toggle via I18nContext
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Wallet, LogOut, Copy, ChevronDown, Search, Globe } from "lucide-react";
import { toast } from "sonner";
import { useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from "@/contexts/WalletContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ForumHeaderProps {
  onNewThread: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function ForumHeader({ onNewThread, searchQuery, onSearchChange }: ForumHeaderProps) {
  const { connect, isConnecting } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { userInfo, isConnected } = useWeb3AuthUser();
  const { lang, t, toggleLang } = useI18n();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${lang === "zh" ? "已複製" : "copied"}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[oklch(0.09_0.01_265/0.95)] backdrop-blur-xl">
      <div className="flex items-center gap-2 px-4 h-12">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-[oklch(1_0_0/0.05)] border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex-1" />

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          title={lang === "zh" ? "Switch to English" : "切換為繁體中文"}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)] transition-colors relative"
        >
          <Globe className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold leading-none bg-[oklch(0.51_0.24_264)] text-white rounded px-0.5">
            {lang === "zh" ? "繁" : "EN"}
          </span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => toast.info(lang === "zh" ? "通知功能即將推出" : "Notifications coming soon")}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[oklch(1_0_0/0.05)] transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* New thread button (when connected) */}
        {isConnected && (
          <Button
            onClick={onNewThread}
            size="sm"
            className="h-8 px-3 text-xs bg-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.55_0.24_264)] text-white hidden sm:flex"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {t("newThread")}
          </Button>
        )}

        {/* Wallet connect / user dropdown */}
        {!isConnected ? (
          <Button
            onClick={connect}
            disabled={isConnecting}
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs border-[oklch(0.51_0.24_264/0.4)] text-[oklch(0.51_0.24_264)] hover:bg-[oklch(0.51_0.24_264/0.1)]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Wallet className="w-3.5 h-3.5 mr-1.5" />
            {isConnecting ? t("walletConnecting") : t("connectWallet")}
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-[oklch(0.7_0.17_162/0.3)] bg-[oklch(0.7_0.17_162/0.08)] hover:bg-[oklch(0.7_0.17_162/0.12)] transition-colors">
                <div className="w-5 h-5 rounded-full bg-[oklch(0.51_0.24_264/0.3)] border border-[oklch(0.51_0.24_264/0.5)] flex items-center justify-center">
                  <span className="text-[8px] font-bold text-[oklch(0.51_0.24_264)]">
                    {userInfo?.alias?.slice(0, 1).toUpperCase() ?? "?"}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[oklch(0.7_0.17_162)] max-w-[80px] truncate hidden sm:block">
                  {userInfo?.alias ?? (lang === "zh" ? "匿名" : "Anonymous")}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-[oklch(0.12_0.01_265)] border-border">
              <div className="px-3 py-2 space-y-0.5">
                <p className="text-[10px] text-muted-foreground">
                  {lang === "zh" ? "已登入為" : "Signed in as"}
                </p>
                <p className="text-xs font-mono text-foreground">{userInfo?.alias}</p>
              </div>
              <DropdownMenuSeparator />
              {userInfo?.address && (
                <DropdownMenuItem onClick={() => handleCopy(userInfo.address, "Address")} className="text-xs cursor-pointer">
                  <Copy className="w-3.5 h-3.5 mr-2" />
                  {lang === "zh" ? "複製地址" : "Copy Address"}
                </DropdownMenuItem>
              )}
              {userInfo?.did && (
                <DropdownMenuItem onClick={() => handleCopy(userInfo.did, "DID")} className="text-xs cursor-pointer">
                  <Copy className="w-3.5 h-3.5 mr-2" />
                  {lang === "zh" ? "複製 DID" : "Copy DID"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={disconnect} className="text-xs text-[oklch(0.65_0.22_25)] cursor-pointer focus:text-[oklch(0.65_0.22_25)]">
                <LogOut className="w-3.5 h-3.5 mr-2" />
                {t("disconnect")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
