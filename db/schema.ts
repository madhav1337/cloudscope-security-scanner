import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const scans = sqliteTable("scans", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  target: text("target").notNull(),
  hostname: text("hostname").notNull(),
  score: integer("score").notNull(),
  grade: text("grade").notNull(),
  status: text("status").notNull().default("completed"),
  policyVersion: integer("policy_version").notNull().default(1),
  reportJson: text("report_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("scans_user_created_idx").on(table.userEmail, table.createdAt),
]);
