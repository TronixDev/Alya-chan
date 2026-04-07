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
	// Chatbot locale settings
	chatbotLocale: text("chatbot_locale"),
	// Prefix settings
	prefix: text("prefix"),
	// Setup settings
	chatbotChannelId: text("chatbot_channel_id"),
	// Global chat channel settings
	globalChannelId: text("global_channel_id"),
	// Global chat webhook settings
	globalWebhookId: text("global_webhook_id"),
	globalWebhookToken: text("global_webhook_token"),
	// Timestamps
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// =========================================
// User Chatbot Locale
// =========================================
export const userChatbotLocale = sqliteTable("user_chatbot_locale", {
	id: text("id").primaryKey(),
	guildId: text("guild_id").notNull(),
	userId: text("user_id").notNull(),
	locale: text("locale").notNull(),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// =========================================
// Shared User Settings
// =========================================
export const userSettings = sqliteTable("user_settings", {
	id: text("id").primaryKey(),
	guildId: text("guild_id").notNull(),
	userId: text("user_id").notNull(),
	namespace: text("namespace").notNull(),
	key: text("key").notNull(),
	value: text("value").notNull(),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// create index if supported by drizzle? (sometimes not diff)

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
