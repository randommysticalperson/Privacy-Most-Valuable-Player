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
