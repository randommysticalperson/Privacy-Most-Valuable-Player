/**
 * I18nContext — 繁體中文 / English language toggle
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 */

import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "zh" | "en";

export const translations = {
  zh: {
    // Nav / Header
    appName: "ZeroForum",
    appTagline: "匿名・加密・去中心化",
    newThread: "發表討論",
    searchPlaceholder: "搜尋討論串...",
    connectWallet: "連接錢包",
    disconnect: "中斷連接",
    notifications: "通知",

    // Sidebar categories
    forum: "論壇",
    trending: "熱門",
    members: "成員",
    sectionCategories: "分類",
    catAll: "全部討論",
    catZkp: "零知識證明",
    catCrypto: "密碼學",
    catIdentity: "身份識別",
    catPrivacy: "隱私技術",
    catDecentralized: "去中心化",
    catGeneral: "一般討論",
    sectionTools: "隱私工具",
    toolE2E: "E2E 加密",
    toolStego: "隱寫術",
    toolHE: "同態加密",
    toolIPFS: "IPFS 儲存",
    toolDP: "差分隱私",
    toolZKP: "ZKP 證明",

    // Thread list
    allThreads: "全部討論串",
    threads: "個討論串",
    newest: "最新",
    hot: "熱門",
    noThreadsTitle: "此分類尚無討論串",
    noThreadsDesc: "成為第一個發表討論的人！",
    welcomeTitle: "歡迎來到 ZeroForum",
    welcomeDesc: "以匿名與隱私為核心的論壇，由 MetaMask、Semaphore ZKP、WebCrypto E2E 和 IPFS 驅動。連接錢包即可發文——你的身份是 ZKP 無效化符，而非使用者名稱。",
    minutesAgo: "分鐘前",
    hoursAgo: "小時前",
    daysAgo: "天前",

    // Thread view
    back: "返回",
    reply: "回覆",
    replyPlaceholder: "撰寫回覆...",
    submitReply: "送出回覆",
    submitting: "送出中...",
    e2eEncrypt: "E2E 加密",
    stegoHide: "隱寫術",
    encryptedBadge: "已加密",
    stegoBadge: "含隱寫",
    connectToReply: "請先連接錢包才能回覆",

    // New thread modal
    newThreadTitle: "發表新討論串",
    threadTitle: "標題",
    threadTitlePlaceholder: "你的討論主題...",
    threadContent: "內容",
    threadContentPlaceholder: "詳細說明你的想法...",
    category: "分類",
    selectCategory: "選擇分類",
    privacyOptions: "隱私選項",
    enableE2E: "E2E 加密內容",
    enableStego: "隱寫術保護",
    cancel: "取消",
    publish: "發表",
    publishing: "發表中...",
    connectToPost: "請先連接錢包才能發表",

    // Wallet panel
    walletTitle: "錢包 / DID 登入",
    walletSubtitle: "MetaMask · EIP-1193 · DID:PKH",
    walletNotDetected: "未偵測到錢包。請安裝",
    walletInstallLink: "MetaMask 以繼續。",
    walletDesc: "無需使用者名稱或密碼。連接您的以太坊錢包即可登入。您的身份由金鑰對衍生——不向任何伺服器傳送資料。",
    walletConnecting: "連接中...",
    walletConnect: "連接錢包",
    walletSupports: "支援 MetaMask、Brave Wallet、Coinbase Wallet 及任何 EIP-1193 提供商",
    walletStepConnect: "連接",
    walletStepVerify: "驗證",
    walletStepDID: "DID",
    walletStepZKP: "ZKP 身份",
    walletConnected: "已連接",
    walletAddress: "地址",
    walletDID: "DID",
    walletNetwork: "網路",
    walletAnonymousAlias: "匿名別名",
    walletSignMessage: "簽署訊息以驗證",
    walletSigning: "簽署中...",
    walletVerified: "已驗證",
    walletSignDesc: "簽署一條訊息以證明你擁有此錢包——不會廣播到鏈上，也不會花費 gas。",

    // Tool labels (right panel)
    privacyTools: "隱私工具",
    toolLabelZKP: "ZKP 證明",
    toolLabelEncrypt: "E2E 加密",
    toolLabelIPFS: "IPFS 儲存",
    toolLabelDP: "差分隱私",
    toolLabelStego: "隱寫術",
    toolLabelHE: "同態加密",
    toolLabelWallet: "錢包 / DID",

    // Mobile bottom nav
    navForum: "論壇",
    navTools: "工具",
    navWallet: "錢包",
  },
  en: {
    // Nav / Header
    appName: "ZeroForum",
    appTagline: "Anonymous · Encrypted · Decentralized",
    newThread: "New Thread",
    searchPlaceholder: "Search threads...",
    connectWallet: "Connect Wallet",
    disconnect: "Disconnect",
    notifications: "Notifications",

    // Sidebar categories
    forum: "Forum",
    trending: "Trending",
    members: "Members",
    sectionCategories: "Categories",
    catAll: "All Threads",
    catZkp: "Zero-Knowledge Proofs",
    catCrypto: "Cryptography",
    catIdentity: "Identity",
    catPrivacy: "Privacy Tech",
    catDecentralized: "Decentralized",
    catGeneral: "General",
    sectionTools: "Privacy Tools",
    toolE2E: "E2E Encryption",
    toolStego: "Steganography",
    toolHE: "Homomorphic Enc.",
    toolIPFS: "IPFS Storage",
    toolDP: "Differential Privacy",
    toolZKP: "ZKP Proof",

    // Thread list
    allThreads: "All Threads",
    threads: "threads",
    newest: "Newest",
    hot: "Hot",
    noThreadsTitle: "No threads in this category",
    noThreadsDesc: "Be the first to start a discussion!",
    welcomeTitle: "Welcome to ZeroForum",
    welcomeDesc: "A privacy-first anonymous forum powered by MetaMask, Semaphore ZKP, WebCrypto E2E, and IPFS. Connect your wallet to post — your identity is a ZKP nullifier, not a username.",
    minutesAgo: "m ago",
    hoursAgo: "h ago",
    daysAgo: "d ago",

    // Thread view
    back: "Back",
    reply: "Reply",
    replyPlaceholder: "Write your reply...",
    submitReply: "Submit Reply",
    submitting: "Submitting...",
    e2eEncrypt: "E2E Encrypt",
    stegoHide: "Stego Hide",
    encryptedBadge: "Encrypted",
    stegoBadge: "Stego",
    connectToReply: "Connect wallet to reply",

    // New thread modal
    newThreadTitle: "Create New Thread",
    threadTitle: "Title",
    threadTitlePlaceholder: "Your discussion topic...",
    threadContent: "Content",
    threadContentPlaceholder: "Describe your thoughts in detail...",
    category: "Category",
    selectCategory: "Select category",
    privacyOptions: "Privacy Options",
    enableE2E: "E2E Encrypt Content",
    enableStego: "Steganography Protection",
    cancel: "Cancel",
    publish: "Publish",
    publishing: "Publishing...",
    connectToPost: "Connect wallet to post",

    // Wallet panel
    walletTitle: "Wallet / DID Login",
    walletSubtitle: "MetaMask · EIP-1193 · DID:PKH",
    walletNotDetected: "No wallet detected. Please install",
    walletInstallLink: "MetaMask to continue.",
    walletDesc: "No username or password required. Connect your Ethereum wallet to log in. Your identity is derived from your key pair — no data is sent to any server.",
    walletConnecting: "Connecting...",
    walletConnect: "Connect Wallet",
    walletSupports: "Supports MetaMask, Brave Wallet, Coinbase Wallet and any EIP-1193 provider",
    walletStepConnect: "Connect",
    walletStepVerify: "Verify",
    walletStepDID: "DID",
    walletStepZKP: "ZKP ID",
    walletConnected: "Connected",
    walletAddress: "Address",
    walletDID: "DID",
    walletNetwork: "Network",
    walletAnonymousAlias: "Anonymous Alias",
    walletSignMessage: "Sign message to verify",
    walletSigning: "Signing...",
    walletVerified: "Verified",
    walletSignDesc: "Sign a message to prove you own this wallet — it is not broadcast on-chain and costs no gas.",

    // Tool labels (right panel)
    privacyTools: "Privacy Tools",
    toolLabelZKP: "ZKP Proof",
    toolLabelEncrypt: "E2E Encryption",
    toolLabelIPFS: "IPFS Storage",
    toolLabelDP: "Differential Privacy",
    toolLabelStego: "Steganography",
    toolLabelHE: "Homomorphic Encryption",
    toolLabelWallet: "Wallet / DID",

    // Mobile bottom nav
    navForum: "Forum",
    navTools: "Tools",
    navWallet: "Wallet",
  },
} as const;

export type TranslationKey = keyof typeof translations.zh;

interface I18nContextValue {
  lang: Lang;
  t: (key: TranslationKey) => string;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("zh");

  const t = (key: TranslationKey): string => translations[lang][key] as string;

  const toggleLang = () => setLang(prev => prev === "zh" ? "en" : "zh");

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
