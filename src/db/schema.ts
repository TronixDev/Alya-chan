import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// =========================================
// Guild Settings & Configuration
// =========================================

// Guild settings and configuration
export const guild = sqliteTable("guild", {
	id: text("id").primaryKey(),
	// Locale settings
	locale: text("locale"),
	// Prefix settings
	prefix: text("prefix"),
	// Setup settings
	setupChannelId: text("setup_channel_id"),
	// Timestamps
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// =========================================
// User Vote & Premium
// =========================================

export const userVote = sqliteTable("user_vote", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	votedAt: text("voted_at").default(sql`CURRENT_TIMESTAMP`),
	expiresAt: text("expires_at").notNull(),
	type: text("type").notNull().default("vote"),
});
