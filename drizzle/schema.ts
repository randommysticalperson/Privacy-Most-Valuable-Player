import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

/**
 * Vulnerability reports submitted anonymously via Semaphore ZKP.
 * The nullifier ensures one report per identity per contract (prevents spam).
 * No user identity is stored — only the ZKP nullifier and public proof data.
 */
export const vulnerabilityReports = mysqlTable("vulnerability_reports", {
  id: int("id").autoincrement().primaryKey(),
  contractAddress: varchar("contractAddress", { length: 42 }).notNull(),
  category: mysqlEnum("category", ["reentrancy", "overflow", "access-control", "oracle", "logic", "other"]).notNull(),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull().default("medium"),
  // ZKP proof fields — nullifier prevents double-reporting per identity per contract
  nullifier: varchar("nullifier", { length: 128 }).notNull().unique(),
  merkleTreeRoot: varchar("merkleTreeRoot", { length: 128 }).notNull(),
  proofScope: varchar("proofScope", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VulnerabilityReport = typeof vulnerabilityReports.$inferSelect;
export type InsertVulnerabilityReport = typeof vulnerabilityReports.$inferInsert;