/**
 * contractRegistry.ts — Curated smart contract registry
 * Sources: Etherscan verified, official protocol docs, OpenZeppelin audits
 * Risk scoring: 1 (lowest) – 5 (highest) based on audit coverage, TVL, age, incidents
 *
 * DISCLAIMER: This registry is for informational purposes only.
 * Audit reports do not guarantee absence of vulnerabilities.
 * Always verify contract addresses from official protocol documentation.
 */

export type RiskLevel = "minimal" | "low" | "medium" | "high" | "critical";
export type ComplianceTag = "KYC/AML" | "OFAC-screened" | "Permissioned" | "Open" | "Sanctioned";
export type ContractCategory =
  | "DEX"
  | "Lending"
  | "Oracle"
  | "Governance"
  | "Stablecoin"
  | "Bridge"
  | "Staking"
  | "NFT"
  | "Library";

export interface AuditRecord {
  firm: string;
  date: string;
  reportUrl: string;
  findings: { critical: number; high: number; medium: number; low: number };
}

export interface ContractEntry {
  id: string;
  name: string;
  protocol: string;
  category: ContractCategory;
  address: string;
  chain: string;
  chainId: number;
  description: string;
  riskLevel: RiskLevel;
  riskScore: number; // 1–100, lower = safer
  complianceTags: ComplianceTag[];
  audits: AuditRecord[];
  tvlUsd?: number; // approximate TVL in USD
  deployedAt: string; // ISO date
  verified: boolean; // Etherscan source verified
  officialDocsUrl: string;
  etherscanUrl: string;
  githubUrl?: string;
  warningNote?: string; // honest caveat
}

export const CONTRACT_REGISTRY: ContractEntry[] = [
  // ─── DEX ──────────────────────────────────────────────────────────────────
  {
    id: "uniswap-v3-factory",
    name: "Uniswap V3 Factory",
    protocol: "Uniswap",
    category: "DEX",
    address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    chain: "Ethereum Mainnet",
    chainId: 1,
    description:
      "Deploys Uniswap V3 liquidity pools. Core factory contract for the concentrated liquidity AMM. Immutable — no admin keys.",
    riskLevel: "low",
    riskScore: 18,
    complianceTags: ["Open"],
    audits: [
      {
        firm: "Trail of Bits",
        date: "2021-03",
        reportUrl: "https://github.com/Uniswap/v3-core/blob/main/audits/tob/audit.pdf",
        findings: { critical: 0, high: 0, medium: 4, low: 6 },
      },
      {
        firm: "ABDK Consulting",
        date: "2021-03",
        reportUrl: "https://github.com/Uniswap/v3-core/blob/main/audits/abdk/audit.pdf",
        findings: { critical: 0, high: 0, medium: 1, low: 3 },
      },
    ],
    tvlUsd: 3_800_000_000,
    deployedAt: "2021-05-05",
    verified: true,
    officialDocsUrl: "https://docs.uniswap.org/contracts/v3/reference/deployments/ethereum-deployments",
    etherscanUrl: "https://etherscan.io/address/0x1F98431c8aD98523631AE4a59f267346ea31F984",
    githubUrl: "https://github.com/Uniswap/v3-core",
  },
  {
    id: "uniswap-v3-router2",
    name: "Uniswap V3 SwapRouter02",
    protocol: "Uniswap",
    category: "DEX",
    address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    chain: "Ethereum Mainnet",
    chainId: 1,
    description:
      "Primary swap router for Uniswap V3 and V2 routes. Handles multi-hop swaps and exact input/output routing.",
    riskLevel: "low",
    riskScore: 20,
    complianceTags: ["Open"],
    audits: [
      {
        firm: "Trail of Bits",
        date: "2021-03",
        reportUrl: "https://github.com/Uniswap/v3-periphery/blob/main/audits/tob/audit.pdf",
        findings: { critical: 0, high: 0, medium: 2, low: 5 },
      },
    ],
    tvlUsd: 0,
    deployedAt: "2021-05-05",
    verified: true,
    officialDocsUrl: "https://docs.uniswap.org/contracts/v3/reference/deployments/ethereum-deployments",
    etherscanUrl: "https://etherscan.io/address/0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    githubUrl: "https://github.com/Uniswap/v3-periphery",
  },

  // ─── Lending ──────────────────────────────────────────────────────────────
  {
    id: "aave-v3-pool",
    name: "Aave V3 Pool",
    protocol: "Aave",
    category: "Lending",
    address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    chain: "Ethereum Mainnet",
    chainId: 1,
    description:
      "Main Aave V3 lending pool. Supports supply, borrow, repay, liquidation with efficiency mode and isolation mode. Upgradeable via governance proxy.",
    riskLevel: "low",
    riskScore: 22,
    complianceTags: ["Open"],
    audits: [
      {
        firm: "Trail of Bits",
        date: "2022-01",
        reportUrl: "https://github.com/aave/aave-v3-core/blob/master/audits/27-01-2022_ToB_AAVEv3.pdf",
        findings: { critical: 0, high: 1, medium: 5, low: 8 },
      },
      {
        firm: "OpenZeppelin",
        date: "2022-01",
        reportUrl: "https://github.com/aave/aave-v3-core/blob/master/audits/07-01-2022_OZ_AaveV3.pdf",
        findings: { critical: 0, high: 0, medium: 3, low: 7 },
      },
      {
        firm: "SigmaPrime",
        date: "2022-01",
        reportUrl: "https://github.com/aave/aave-v3-core/blob/master/audits/27-01-2022_SigmaPrime_AaveV3.pdf",
        findings: { critical: 0, high: 0, medium: 2, low: 4 },
      },
    ],
    tvlUsd: 12_500_000_000,
    deployedAt: "2023-01-27",
    verified: true,
    officialDocsUrl: "https://aave.com/docs/resources/addresses",
    etherscanUrl: "https://etherscan.io/address/0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    githubUrl: "https://github.com/aave/aave-v3-core",
    warningNote:
      "Upgradeable proxy — governance can modify implementation. Monitor Aave governance proposals.",
  },
  {
    id: "compound-v3-usdc",
    name: "Compound V3 USDC (Comet)",
    protocol: "Compound",
    category: "Lending",
    address: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
    chain: "Ethereum Mainnet",
    chainId: 1,
    description:
      "Compound III (Comet) USDC market. Single-asset borrowing model with USDC as base. Permissioned collateral list managed by Compound governance.",
    riskLevel: "low",
    riskScore: 25,
    complianceTags: ["Open"],
    audits: [
      {
        firm: "OpenZeppelin",
        date: "2022-08",
        reportUrl: "https://blog.openzeppelin.com/compound-iii-audit",
        findings: { critical: 0, high: 1, medium: 4, low: 6 },
      },
      {
        firm: "ChainSecurity",
        date: "2022-08",
        reportUrl: "https://compound.finance/documents/Compound_III_ChainSecurity_Audit.pdf",
        findings: { critical: 0, high: 0, medium: 3, low: 5 },
      },
    ],
    tvlUsd: 2_100_000_000,
    deployedAt: "2022-08-26",
    verified: true,
    officialDocsUrl: "https://docs.compound.finance/",
    etherscanUrl: "https://etherscan.io/address/0xc3d688B66703497DAA19211EEdff47f25384cdc3",
    githubUrl: "https://github.com/compound-finance/comet",
  },

  // ─── Compliant / Permissioned DeFi ────────────────────────────────────────
  {
    id: "aave-arc-pool",
    name: "Aave Arc (Permissioned Pool)",
    protocol: "Aave",
    category: "Lending",
    address: "0x37D7306019a38Af123e4b245Eb6C28AF552e0bB0",
    chain: "Ethereum Mainnet",
    chainId: 1,
    description:
      "Aave Arc is a permissioned liquidity market requiring KYC/AML whitelisting by Fireblocks. Only verified institutional participants can supply or borrow.",
    riskLevel: "low",
    riskScore: 15,
    complianceTags: ["KYC/AML", "OFAC-screened", "Permissioned"],
    audits: [
      {
        firm: "OpenZeppelin",
        date: "2022-01",
        reportUrl: "https://github.com/aave/aave-v3-core/blob/master/audits/07-01-2022_OZ_AaveV3.pdf",
        findings: { critical: 0, high: 0, medium: 3, low: 7 },
      },
    ],
    tvlUsd: 45_000_000,
    deployedAt: "2022-01-01",
    verified: true,
    officialDocsUrl: "https://docs.aave.com/developers/deployed-contracts/aave-arc",
    etherscanUrl: "https://etherscan.io/address/0x37D7306019a38Af123e4b245Eb6C28AF552e0bB0",
    githubUrl: "https://github.com/aave/aave-v3-core",
    warningNote:
      "Access requires KYC whitelisting via Fireblocks. Not accessible to anonymous wallets.",
  },

  // ─── Oracle ───────────────────────────────────────────────────────────────
  {
    id: "chainlink-eth-usd",
    name: "Chainlink ETH/USD Price Feed",
    protocol: "Chainlink",
    category: "Oracle",
    address: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    chain: "Ethereum Mainnet",
    chainId: 1,
    description:
      "Chainlink decentralized oracle price feed for ETH/USD. Used by Aave, Compound, MakerDAO, and hundreds of DeFi protocols as the canonical ETH price source.",
    riskLevel: "minimal",
    riskScore: 12,
    complianceTags: ["Open"],
    audits: [
      {
        firm: "Sigma Prime",
        date: "2020-06",
        reportUrl: "https://research.chain.link/ocr-security-review.pdf",
        findings: { critical: 0, high: 0, medium: 1, low: 3 },
      },
    ],
    tvlUsd: 0,
    deployedAt: "2020-01-01",
    verified: true,
    officialDocsUrl: "https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum",
    etherscanUrl: "https://etherscan.io/address/0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    githubUrl: "https://github.com/smartcontractkit/chainlink",
  },

  // ─── Stablecoin ───────────────────────────────────────────────────────────
  {
    id: "usdc-token",
    name: "USD Coin (USDC)",
    protocol: "Circle",
    category: "Stablecoin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    chain: "Ethereum Mainnet",
    chainId: 1,
    description:
      "Circle's USD-backed stablecoin. Regulated money transmitter. Supports OFAC blacklisting — Circle can freeze addresses. Fully reserved, monthly attestations by Grant Thornton.",
    riskLevel: "low",
    riskScore: 20,
    complianceTags: ["KYC/AML", "OFAC-screened"],
    audits: [
      {
        firm: "Trail of Bits",
        date: "2018-10",
        reportUrl: "https://www.circle.com/hubfs/usdc-audit-report.pdf",
        findings: { critical: 0, high: 0, medium: 2, low: 4 },
      },
    ],
    tvlUsd: 43_000_000_000,
    deployedAt: "2018-09-26",
    verified: true,
    officialDocsUrl: "https://developers.circle.com/stablecoins/docs/usdc-on-main-networks",
    etherscanUrl: "https://etherscan.io/address/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    githubUrl: "https://github.com/centrehq/centre-tokens",
    warningNote:
      "Centralized freeze capability — Circle can blacklist any address per OFAC requirements.",
  },
  {
    id: "dai-token",
    name: "Dai Stablecoin (DAI)",
    protocol: "MakerDAO",
    category: "Stablecoin",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    chain: "Ethereum Mainnet",
    chainId: 1,
    description:
      "Decentralized, crypto-collateralized stablecoin governed by MakerDAO. No centralized freeze capability. Backed by ETH, WBTC, and other collateral types.",
    riskLevel: "low",
    riskScore: 28,
    complianceTags: ["Open"],
    audits: [
      {
        firm: "Trail of Bits",
        date: "2018-09",
        reportUrl: "https://github.com/makerdao/audits/blob/master/mcd/trail-of-bits.pdf",
        findings: { critical: 0, high: 1, medium: 3, low: 6 },
      },
    ],
    tvlUsd: 5_200_000_000,
    deployedAt: "2019-11-18",
    verified: true,
    officialDocsUrl: "https://docs.makerdao.com/smart-contract-modules/dai-module/dai-detailed-documentation",
    etherscanUrl: "https://etherscan.io/address/0x6B175474E89094C44Da98b954EedeAC495271d0F",
    githubUrl: "https://github.com/makerdao/dss",
  },

  // ─── Governance ───────────────────────────────────────────────────────────
  {
    id: "compound-governor-bravo",
    name: "Compound Governor Bravo",
    protocol: "Compound",
    category: "Governance",
    address: "0xc0Da02939E1441F497fd74F78cE7Decb17B66529",
    chain: "Ethereum Mainnet",
    chainId: 1,
    description:
      "Compound's on-chain governance contract. COMP token holders propose and vote on protocol changes. 2-day voting period, 2-day timelock.",
    riskLevel: "medium",
    riskScore: 42,
    complianceTags: ["Open"],
    audits: [
      {
        firm: "OpenZeppelin",
        date: "2020-10",
        reportUrl: "https://blog.openzeppelin.com/compound-governor-bravo-audit",
        findings: { critical: 0, high: 0, medium: 2, low: 3 },
      },
    ],
    tvlUsd: 0,
    deployedAt: "2021-02-01",
    verified: true,
    officialDocsUrl: "https://docs.compound.finance/governance/",
    etherscanUrl: "https://etherscan.io/address/0xc0Da02939E1441F497fd74F78cE7Decb17B66529",
    githubUrl: "https://github.com/compound-finance/compound-protocol",
    warningNote:
      "Governance attack risk — malicious proposals can drain protocol funds if quorum is met. Monitor active proposals.",
  },

  // ─── Library / Infrastructure ─────────────────────────────────────────────
  {
    id: "oz-erc20",
    name: "OpenZeppelin ERC-20 (Reference)",
    protocol: "OpenZeppelin",
    category: "Library",
    address: "0x0000000000000000000000000000000000000000",
    chain: "Ethereum Mainnet",
    chainId: 1,
    description:
      "OpenZeppelin's battle-tested ERC-20 implementation. Used as the base for thousands of tokens. Not a deployed contract — reference library only.",
    riskLevel: "minimal",
    riskScore: 5,
    complianceTags: ["Open"],
    audits: [
      {
        firm: "OpenZeppelin Internal",
        date: "2023-01",
        reportUrl: "https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/audits",
        findings: { critical: 0, high: 0, medium: 0, low: 1 },
      },
    ],
    tvlUsd: 0,
    deployedAt: "2017-01-01",
    verified: true,
    officialDocsUrl: "https://docs.openzeppelin.com/contracts/5.x/erc20",
    etherscanUrl: "https://etherscan.io/",
    githubUrl: "https://github.com/OpenZeppelin/openzeppelin-contracts",
  },

  // ─── Sanctioned / Warning ─────────────────────────────────────────────────
  {
    id: "tornado-cash-router",
    name: "Tornado Cash Router",
    protocol: "Tornado Cash",
    category: "DEX",
    address: "0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b",
    chain: "Ethereum Mainnet",
    chainId: 1,
    description:
      "Privacy mixer using ZK-SNARKs. Technically sound cryptography, but placed on OFAC SDN list in August 2022. Interacting with this contract may have legal consequences in certain jurisdictions.",
    riskLevel: "critical",
    riskScore: 95,
    complianceTags: ["Sanctioned"],
    audits: [
      {
        firm: "ABDK Consulting",
        date: "2020-12",
        reportUrl: "https://tornado.cash/audits/TornadoCash_audit_ABDK.pdf",
        findings: { critical: 0, high: 0, medium: 1, low: 2 },
      },
    ],
    tvlUsd: 0,
    deployedAt: "2019-12-17",
    verified: true,
    officialDocsUrl: "https://docs.tornado.cash/",
    etherscanUrl: "https://etherscan.io/address/0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b",
    githubUrl: "https://github.com/tornadocash/tornado-core",
    warningNote:
      "OFAC SDN List — sanctioned by US Treasury August 2022. Interacting may violate US law. Listed for educational/research reference only.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  minimal: {
    label: "極低風險",
    color: "oklch(0.7_0.17_162)",
    bg: "oklch(0.7_0.17_162/0.1)",
    border: "oklch(0.7_0.17_162/0.3)",
  },
  low: {
    label: "低風險",
    color: "oklch(0.75_0.18_145)",
    bg: "oklch(0.75_0.18_145/0.1)",
    border: "oklch(0.75_0.18_145/0.3)",
  },
  medium: {
    label: "中等風險",
    color: "oklch(0.75_0.18_75)",
    bg: "oklch(0.75_0.18_75/0.1)",
    border: "oklch(0.75_0.18_75/0.3)",
  },
  high: {
    label: "高風險",
    color: "oklch(0.7_0.22_30)",
    bg: "oklch(0.7_0.22_30/0.1)",
    border: "oklch(0.7_0.22_30/0.3)",
  },
  critical: {
    label: "制裁/禁止",
    color: "oklch(0.65_0.25_20)",
    bg: "oklch(0.65_0.25_20/0.1)",
    border: "oklch(0.65_0.25_20/0.3)",
  },
};

export const COMPLIANCE_CONFIG: Record<ComplianceTag, { label: string; color: string }> = {
  "KYC/AML": { label: "KYC/AML", color: "oklch(0.51_0.24_264)" },
  "OFAC-screened": { label: "OFAC 篩查", color: "oklch(0.51_0.24_264)" },
  Permissioned: { label: "許可制", color: "oklch(0.75_0.18_75)" },
  Open: { label: "開放", color: "oklch(0.7_0.17_162)" },
  Sanctioned: { label: "⚠ 制裁名單", color: "oklch(0.65_0.25_20)" },
};

export const CATEGORIES: ContractCategory[] = [
  "DEX", "Lending", "Oracle", "Governance", "Stablecoin", "Bridge", "Staking", "NFT", "Library",
];

export function filterContracts(
  contracts: ContractEntry[],
  query: string,
  category: ContractCategory | "All",
  riskFilter: RiskLevel | "All",
  complianceFilter: ComplianceTag | "All"
): ContractEntry[] {
  return contracts.filter((c) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.protocol.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);
    const matchesCategory = category === "All" || c.category === category;
    const matchesRisk = riskFilter === "All" || c.riskLevel === riskFilter;
    const matchesCompliance =
      complianceFilter === "All" || c.complianceTags.includes(complianceFilter);
    return matchesQuery && matchesCategory && matchesRisk && matchesCompliance;
  });
}

export function formatTvl(usd: number): string {
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(0)}M`;
  if (usd > 0) return `$${usd.toLocaleString()}`;
  return "—";
}

export function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
