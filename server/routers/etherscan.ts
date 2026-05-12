/**
 * etherscan.ts — Etherscan API proxy router
 * Proxies requests to Etherscan API to avoid CORS issues on the frontend.
 * Supports: contract verification status, ABI, source code, transaction count, ETH balance.
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const ETHERSCAN_BASE = "https://api.etherscan.io/api";
const ETHERSCAN_SEPOLIA = "https://api-sepolia.etherscan.io/api";

// Ethereum address regex
const ethAddressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Invalid Ethereum address format");

type Network = "mainnet" | "sepolia";

function getBaseUrl(network: Network): string {
  return network === "sepolia" ? ETHERSCAN_SEPOLIA : ETHERSCAN_BASE;
}

async function etherscanFetch(
  params: Record<string, string>,
  network: Network,
  apiKey?: string
): Promise<unknown> {
  const url = new URL(getBaseUrl(network));
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  // Use provided API key or fall back to env var
  const key = apiKey || process.env.ETHERSCAN_API_KEY || "";
  if (key) url.searchParams.set("apikey", key);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "ZeroForum/1.0" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `Etherscan returned HTTP ${res.status}`,
    });
  }

  const data = (await res.json()) as { status: string; message: string; result: unknown };

  // Etherscan returns status "0" for errors (but not always — NOTOK message)
  if (data.status === "0" && data.message === "NOTOK") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: typeof data.result === "string" ? data.result : "Etherscan API error",
    });
  }

  return data.result;
}

export const etherscanRouter = router({
  /**
   * Look up a contract: verification status, ABI, source code, constructor args,
   * compiler version, ETH balance, and transaction count.
   */
  lookupContract: publicProcedure
    .input(
      z.object({
        address: ethAddressSchema,
        network: z.enum(["mainnet", "sepolia"]).default("mainnet"),
      })
    )
    .query(async ({ input }) => {
      const { address, network } = input;

      // Run all queries in parallel for speed
      const [sourceResult, balanceResult, txCountResult] = await Promise.allSettled([
        // Source code + ABI + verification status (module=contract, action=getsourcecode)
        etherscanFetch(
          { module: "contract", action: "getsourcecode", address },
          network
        ),
        // ETH balance
        etherscanFetch(
          { module: "account", action: "balance", address, tag: "latest" },
          network
        ),
        // Transaction count
        etherscanFetch(
          { module: "account", action: "txlist", address, startblock: "0", endblock: "99999999", page: "1", offset: "1", sort: "desc" },
          network
        ),
      ]);

      // Parse source code result
      type SourceItem = {
        SourceCode: string;
        ABI: string;
        ContractName: string;
        CompilerVersion: string;
        OptimizationUsed: string;
        Runs: string;
        ConstructorArguments: string;
        EVMVersion: string;
        Library: string;
        LicenseType: string;
        Proxy: string;
        Implementation: string;
        SwarmSource: string;
      };

      let verified = false;
      let contractName = "";
      let compilerVersion = "";
      let abi: unknown[] = [];
      let sourceCode = "";
      let licenseType = "";
      let optimizationUsed = false;
      let evmVersion = "";
      let isProxy = false;
      let implementationAddress = "";

      if (sourceResult.status === "fulfilled") {
        const items = sourceResult.value as SourceItem[];
        if (Array.isArray(items) && items.length > 0) {
          const item = items[0];
          verified = item.ABI !== "Contract source code not verified";
          contractName = item.ContractName || "";
          compilerVersion = item.CompilerVersion || "";
          licenseType = item.LicenseType || "";
          optimizationUsed = item.OptimizationUsed === "1";
          evmVersion = item.EVMVersion || "";
          isProxy = item.Proxy === "1";
          implementationAddress = item.Implementation || "";
          sourceCode = item.SourceCode || "";

          if (verified && item.ABI) {
            try {
              abi = JSON.parse(item.ABI) as unknown[];
            } catch {
              abi = [];
            }
          }
        }
      }

      // Parse ETH balance (in wei → convert to ETH)
      let ethBalance = "0";
      if (balanceResult.status === "fulfilled") {
        const weiStr = balanceResult.value as string;
        if (weiStr && !isNaN(Number(weiStr))) {
          const eth = Number(BigInt(weiStr)) / 1e18;
          ethBalance = eth.toFixed(6);
        }
      }

      // Parse tx count (we only fetched 1 tx to check if there are any)
      let hasTxHistory = false;
      if (txCountResult.status === "fulfilled") {
        const txs = txCountResult.value;
        hasTxHistory = Array.isArray(txs) && txs.length > 0;
      }

      return {
        address,
        network,
        verified,
        contractName,
        compilerVersion,
        licenseType,
        optimizationUsed,
        evmVersion,
        isProxy,
        implementationAddress,
        abi,
        // Truncate source code to 8KB for the response (full source can be very large)
        sourceCode: sourceCode.slice(0, 8192),
        sourceCodeTruncated: sourceCode.length > 8192,
        ethBalance,
        hasTxHistory,
        etherscanUrl:
          network === "sepolia"
            ? `https://sepolia.etherscan.io/address/${address}`
            : `https://etherscan.io/address/${address}`,
      };
    }),

  /**
   * Get recent transactions for a contract address (last 10)
   */
  getTransactions: publicProcedure
    .input(
      z.object({
        address: ethAddressSchema,
        network: z.enum(["mainnet", "sepolia"]).default("mainnet"),
        limit: z.number().int().min(1).max(25).default(10),
      })
    )
    .query(async ({ input }) => {
      const { address, network, limit } = input;

      const result = await etherscanFetch(
        {
          module: "account",
          action: "txlist",
          address,
          startblock: "0",
          endblock: "99999999",
          page: "1",
          offset: String(limit),
          sort: "desc",
        },
        network
      );

      type TxItem = {
        hash: string;
        from: string;
        to: string;
        value: string;
        timeStamp: string;
        functionName: string;
        isError: string;
        gasUsed: string;
      };

      if (!Array.isArray(result)) return [];

      return (result as TxItem[]).map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        valueEth: (Number(BigInt(tx.value || "0")) / 1e18).toFixed(6),
        timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
        functionName: tx.functionName || "(transfer)",
        isError: tx.isError === "1",
        gasUsed: tx.gasUsed,
      }));
    }),
});
