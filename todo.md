# ZeroForum — Project TODO

## Core Forum
- [x] Three-column forum layout (sidebar, thread list, right panel)
- [x] Dark space glassmorphism design (bg #080C14, glass panels)
- [x] Space Grotesk + DM Sans + JetBrains Mono fonts
- [x] Forum thread list with categories
- [x] Thread view with reply composer
- [x] New thread modal
- [x] Live search for forum threads
- [x] Mobile bottom nav bar with iOS safe-area support
- [x] PWA manifest + icons + Apple meta tags

## Authentication
- [x] Native window.ethereum EIP-1193 wallet auth (no Web3Auth)
- [x] WalletContext with connect/disconnect/sign
- [x] DID:PKH identity derivation from wallet address
- [x] Anonymous alias generation

## Privacy Tools
- [x] Semaphore ZKP panel (Groth16 browser-side proofs)
- [x] E2E encryption panel (AES-GCM-256 + ECDH P-256, WebCrypto)
- [x] IPFS storage panel (Pinata demo mode)
- [x] Differential privacy analytics panel (Laplace mechanism)
- [x] Steganography panel (LSB image encoding/decoding + PSNR)
- [x] Homomorphic encryption panel (BFV scheme demo + private voting)

## Contract Registry
- [x] Contract Registry page with 20+ curated contracts
- [x] Risk scoring (LOW/MEDIUM/HIGH/CRITICAL)
- [x] Compliance tags (KYC/AML, OFAC-screened, Permissioned, Sanctioned)
- [x] Audit records with links (OpenZeppelin, Trail of Bits, etc.)
- [x] Sidebar navigation link to Contract Registry

## Etherscan Live Lookup (Session 4)
- [x] Backend tRPC router (server/routers/etherscan.ts) — CORS-safe proxy
- [x] lookupContract procedure: verification status, ABI, source code, balance, proxy detection
- [x] getTransactions procedure: recent 10 transactions with function names
- [x] EtherscanLookup frontend component (client/src/components/EtherscanLookup.tsx)
  - [x] Address input + network selector (Mainnet / Sepolia)
  - [x] Verification badge (ShieldCheck / ShieldX)
  - [x] Contract details grid (name, compiler, license, optimization, EVM, balance)
  - [x] Proxy detection + implementation address link
  - [x] Collapsible ABI viewer with function type badges + copy
  - [x] Collapsible source code viewer (8KB preview) + copy
  - [x] Collapsible recent transactions list
  - [x] Empty state and error state
- [x] etherscanRouter registered in server/routers.ts
- [x] EtherscanLookup integrated into ContractRegistry page (replaced old inline component)
- [x] i18n keys added to I18nContext (zh + en): all etherscan* keys + copied

## i18n
- [x] Full 繁體中文 / English toggle (I18nContext)
- [x] All forum components use useI18n()
- [x] All privacy tool panels use useI18n()
- [x] Contract Registry uses useI18n()
- [x] Etherscan lookup panel uses useI18n()

## Infrastructure
- [x] Project upgraded to web-db-user (tRPC + Express backend + MySQL)
- [x] TypeScript zero errors (node_modules/.bin/tsc --noEmit)
- [x] ETHERSCAN_API_KEY env var supported (optional, rate-limited without key)

## Session 5 — Three Feature Additions

### 1. Etherscan API Key
- [x] User-provided API key input in EtherscanLookup panel (localStorage persistence)
- [x] Settings gear icon toggles collapsible API key panel
- [x] "API Key" badge shown in header when key is active
- [x] apiKey passed to both lookupContract and getTransactions tRPC procedures
- [x] Backend etherscan router accepts optional apiKey in both procedure inputs

### 2. Contract Card One-Click Lookup
- [x] Add ⚡ (Zap) icon button to each ContractCard address row
- [x] Lift lookupAddress state to ContractRegistry parent
- [x] Auto-scroll to EtherscanLookup panel on click (smooth scroll)
- [x] Pass initialAddress prop to EtherscanLookupPanel (key prop forces re-mount)

### 3. ZKP Anonymous Vulnerability Report
- [x] DB schema: vulnerability_reports table (9 columns: id, contractAddress, category, description, severity, nullifier, merkleTreeRoot, proofScope, createdAt)
- [x] DB migration applied (pnpm db:push)
- [x] Backend tRPC: submit procedure (nullifier uniqueness check, insert report)
- [x] Backend tRPC: list procedure (list reports for a contract, 50 max)
- [x] Backend tRPC: count procedure (lightweight badge count)
- [x] reportsRouter registered in server/routers.ts
- [x] Frontend: ReportModal component (category selector, severity selector, description, ZKP proof generation + auto-submit)
- [x] Frontend: 匿名舉報 / Report button in ContractCard footer
- [x] Frontend: Report count badge on Report button
- [x] Frontend: Modal auto-submits after Semaphore proof is verified
- [x] Vitest: 6 input validation tests in server/reports.test.ts (all passing)

## Session 6 — Anonymous Reports List in Expanded Card
- [x] Fetch reports via trpc.reports.list in ContractCard when expanded (lazy: only fires when card is open)
- [x] Render reports list below audit records in the expanded section
- [x] Show severity badge (color-coded), category badge, 3-line truncated description, relative timestamp
- [x] Show loading spinner while fetching
- [x] Show dashed empty state when no reports exist
- [x] ZKP verified badge on each report row
- [x] i18n labels for report list section (zh + en)

## Session 7 — ContractCard UX Improvements
- [x] Severity warning banner: show red banner on ContractCard when any report is critical/high (lazy — appears once card is expanded and reports loaded)
- [x] Expand-full-text button on each report row (toggle clamp-3 / full text, shown only when description > 120 chars)
- [x] Sort-by-report-count toggle button in filter bar (red active state, batch-fetches counts on demand, sorts descending)

## Session 8 — MetaMask Hook
- [ ] Create client/src/hooks/useMetaMask.ts — clean hook wrapping WalletContext
- [ ] Expose: isInstalled, isConnected, account, chainId, chainName, connect(), disconnect(), switchChain(), signMessage()
- [ ] Add EIP-1193 event listeners (accountsChanged, chainChanged, disconnect) for live updates
- [ ] Wire useMetaMask into WalletAuthPanel (replace direct useWallet calls where appropriate)
- [ ] Wire useMetaMask into ReportModal (replace direct useWallet calls)
- [ ] Export hook from client/src/hooks/index.ts

## Session 9 — Burner Wallet
- [x] Add burner wallet type to WalletContext: generate ephemeral keypair via ethers HDNodeWallet.createRandom()
- [x] Persist encrypted private key in localStorage (AES-GCM via WebCrypto, PBKDF2 key derivation, 100k iterations)
- [x] Add walletType: 'metamask' | 'burner' | null to WalletState
- [x] Add createBurner() and burnWallet() actions to WalletContext
- [x] Add signMessage() to WalletState (works for both MetaMask and burner)
- [x] Restore burner session on page reload (decrypt from localStorage)
- [x] Update WalletAuthPanel: show orange "建立燃燒錢包" button below MetaMask connect with divider
- [x] Show orange ephemeral warning banner when burner wallet is active
- [x] Show "銷毀錢包 / Burn & Forget" button (replaces disconnect for burner)
- [x] Show wallet type badge (Burner vs MetaMask/EIP-1193) in connected state
- [x] Hide Etherscan link for burner wallets (no on-chain activity)
- [x] TypeScript zero errors (fixed HDNodeWallet type + Uint8Array<ArrayBuffer> WebCrypto casts)

## Session 9 — Security Notes (Known Limitations)
- [x] Burner wallet AES-GCM encryption: salt and ciphertext both stored in localStorage — this is obfuscation against casual inspection, not protection against local compromise. Acceptable for ephemeral/anonymous use case where the user is expected to burn the wallet after use.
- [x] Etherscan link hidden for burner wallets: UX design choice to discourage on-chain activity with ephemeral keys, not because burner addresses cannot have on-chain activity.
