/**
 * reports.ts — Anonymous Vulnerability Report Router
 * Uses Semaphore ZKP nullifiers to allow anonymous, spam-resistant reporting.
 * No user identity is ever stored — only the ZKP proof metadata.
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { vulnerabilityReports } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

const ethAddressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Invalid Ethereum address format");

export const reportsRouter = router({
  /**
   * Submit an anonymous vulnerability report.
   * The nullifier (from Semaphore proof) prevents the same identity from
   * submitting more than one report per contract.
   */
  submit: publicProcedure
    .input(
      z.object({
        contractAddress: ethAddressSchema,
        category: z.enum(["reentrancy", "overflow", "access-control", "oracle", "logic", "other"]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        description: z.string().min(20, "Description must be at least 20 characters").max(2000),
        // ZKP proof metadata
        nullifier: z.string().min(1),
        merkleTreeRoot: z.string().min(1),
        proofScope: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check for duplicate nullifier (same identity already reported this contract)
      const existing = await db
        .select({ id: vulnerabilityReports.id })
        .from(vulnerabilityReports)
        .where(eq(vulnerabilityReports.nullifier, input.nullifier))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A report with this proof nullifier already exists. Each identity can only submit one report.",
        });
      }

      await db.insert(vulnerabilityReports).values({
        contractAddress: input.contractAddress.toLowerCase(),
        category: input.category,
        severity: input.severity,
        description: input.description,
        nullifier: input.nullifier,
        merkleTreeRoot: input.merkleTreeRoot,
        proofScope: input.proofScope,
      });

      return { success: true };
    }),

  /**
   * List all anonymous reports for a given contract address.
   */
  list: publicProcedure
    .input(
      z.object({
        contractAddress: ethAddressSchema,
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select({
          id: vulnerabilityReports.id,
          category: vulnerabilityReports.category,
          severity: vulnerabilityReports.severity,
          description: vulnerabilityReports.description,
          createdAt: vulnerabilityReports.createdAt,
        })
        .from(vulnerabilityReports)
        .where(eq(vulnerabilityReports.contractAddress, input.contractAddress.toLowerCase()))
        .orderBy(desc(vulnerabilityReports.createdAt))
        .limit(50);

      return rows;
    }),

  /**
   * Get report count for a contract (lightweight, for badge display).
   */
  count: publicProcedure
    .input(z.object({ contractAddress: ethAddressSchema }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { count: 0 };
      const rows = await db
        .select({ id: vulnerabilityReports.id })
        .from(vulnerabilityReports)
        .where(eq(vulnerabilityReports.contractAddress, input.contractAddress.toLowerCase()));
      return { count: rows.length };
    }),
});
