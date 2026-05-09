/**
 * MobileBottomNav — Bottom tab bar for mobile (md:hidden)
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 * Tabs: Forum | Tools | Wallet
 */

import { MessageSquare, Wrench, Wallet } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { motion } from "framer-motion";

type ActiveView = "forum" | "tools" | "wallet";

interface MobileBottomNavProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export default function MobileBottomNav({ activeView, onViewChange }: MobileBottomNavProps) {
  const { t } = useI18n();

  const tabs = [
    { id: "forum" as ActiveView, icon: MessageSquare, label: t("navForum") },
    { id: "tools" as ActiveView, icon: Wrench, label: t("navTools") },
    { id: "wallet" as ActiveView, icon: Wallet, label: t("navWallet") },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-[oklch(0.09_0.01_265/0.97)] backdrop-blur-xl">
      <div className="flex items-stretch h-16 safe-area-bottom">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors"
              aria-label={tab.label}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[oklch(0.51_0.24_264)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive
                    ? "text-[oklch(0.51_0.24_264)]"
                    : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] transition-colors ${
                  isActive
                    ? "text-[oklch(0.51_0.24_264)] font-medium"
                    : "text-muted-foreground"
                }`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
