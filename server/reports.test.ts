/**
 * reports.test.ts — Unit tests for the vulnerability reports router
 * Tests the input validation logic without requiring a live database.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── Replicate the input schemas from the router ─────────────────────────────

const ethAddressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Invalid Ethereum address format");

const submitSchema = z.object({
  contractAddress: ethAddressSchema,
  category: z.enum(["reentrancy", "overflow", "access-control", "oracle", "logic", "other"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(20).max(2000),
  nullifier: z.string().min(1),
  merkleTreeRoot: z.string().min(1),
  proofScope: z.string().min(1),
});

const countSchema = z.object({ contractAddress: ethAddressSchema });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("reports router — input validation", () => {
  const validAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const validNullifier = "12345678901234567890123456789012345678901234567890123456789012345678";

  it("accepts a valid submit payload", () => {
    const result = submitSchema.safeParse({
      contractAddress: validAddress,
      category: "reentrancy",
      severity: "high",
      description: "This is a detailed description of the vulnerability found in the contract.",
      nullifier: validNullifier,
      merkleTreeRoot: "99887766554433221100",
      proofScope: "privacy-mvp-demo-v1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects description shorter than 20 characters", () => {
    const result = submitSchema.safeParse({
      contractAddress: validAddress,
      category: "overflow",
      severity: "medium",
      description: "Too short",
      nullifier: validNullifier,
      merkleTreeRoot: "root",
      proofScope: "scope",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid Ethereum address", () => {
    const result = submitSchema.safeParse({
      contractAddress: "not-an-address",
      category: "logic",
      severity: "low",
      description: "A valid description that is long enough to pass validation.",
      nullifier: validNullifier,
      merkleTreeRoot: "root",
      proofScope: "scope",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = submitSchema.safeParse({
      contractAddress: validAddress,
      category: "flash-loan", // not in enum
      severity: "critical",
      description: "A valid description that is long enough to pass validation.",
      nullifier: validNullifier,
      merkleTreeRoot: "root",
      proofScope: "scope",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid severity levels", () => {
    for (const severity of ["low", "medium", "high", "critical"] as const) {
      const result = submitSchema.safeParse({
        contractAddress: validAddress,
        category: "other",
        severity,
        description: "A valid description that is long enough to pass validation.",
        nullifier: validNullifier,
        merkleTreeRoot: "root",
        proofScope: "scope",
      });
      expect(result.success, `severity '${severity}' should be valid`).toBe(true);
    }
  });

  it("validates count query address", () => {
    expect(countSchema.safeParse({ contractAddress: validAddress }).success).toBe(true);
    expect(countSchema.safeParse({ contractAddress: "0xinvalid" }).success).toBe(false);
  });
});
