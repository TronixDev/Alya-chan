import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { and, desc, eq, gt, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { Configuration, Environment } from "#alya/config";
import { DEFAULT_LANGUAGE } from "#alya/models";
import * as schema from "./schema";

const client = createClient({
	url:
		Environment.DatabaseUrl ?? "Hmm? Looks like the database URL is missing.",
	authToken: Environment.DatabasePassword,
});

export const db = drizzle(client);

export interface ISetup {
	id: string;
	guildId: string;
	channelId: string;
	createdAt: Date;
}

export class AlyaDatabase {
	public db = db;
	private cache = new Map<
		string,
		{ locale?: string; defaultVolume?: number }
	>();

	/**
	 * Get the locale for a guild from the database, or return default if not found.
	 * @param guildId Guild ID
	 * @returns locale string
	 */
	public async getLocale(guildId: string): Promise<string> {
		const cached = this.cache.get(guildId)?.locale;
		if (cached) return cached;
		const data = await this.db
			.select()
			.from(schema.guild)
			.where(eq(schema.guild.id, guildId))
			.get();
		if (data?.locale) {
			this.cache.set(guildId, {
				...this.cache.get(guildId),
				locale: data.locale,
			});
			return data.locale;
		}
		return Configuration.defaultLocale ?? "en-US";
	}

	/**
	 * Get premium status details for a user
	 * @param userId The user ID
	 */
	public async getPremiumStatus(
		userId: string,
	): Promise<{ type: string; timeRemaining: number } | null> {
		const now = new Date().toISOString();
		// Check for regular premium first, then fall back to vote premium
		let vote = await this.db
			.select()
			.from(schema.userVote)
			.where(
				and(
					eq(schema.userVote.userId, userId),
					eq(schema.userVote.type, "regular"),
					gt(schema.userVote.expiresAt, now),
				),
			)
			.orderBy(desc(schema.userVote.expiresAt))
			.get();

		if (!vote) {
			// If no regular premium, check for vote premium
			vote = await this.db
				.select()
				.from(schema.userVote)
				.where(
					and(
						eq(schema.userVote.userId, userId),
						eq(schema.userVote.type, "vote"),
						gt(schema.userVote.expiresAt, now),
					),
				)
				.orderBy(desc(schema.userVote.expiresAt))
				.get();
		}

		if (!vote) return null;

		return {
			type: vote.type,
			timeRemaining: new Date(vote.expiresAt).getTime() - Date.now(),
		};
	}

	/**
	 * Get the prefix for a guild from the database, or return default if not found.
	 * @param guildId Guild ID
	 * @returns prefix string
	 */
	public async getPrefix(guildId: string): Promise<string> {
		const data = await this.db
			.select()
			.from(schema.guild)
			.where(eq(schema.guild.id, guildId))
			.get();
		return data?.prefix ?? Configuration.defaultPrefix;
	}

	/**
	 * Get the setup data for a guild
	 * @param guildId The guild ID
	 */
	public async getChatbotSetup(guildId: string): Promise<ISetup | null> {
		const data = await this.db
			.select()
			.from(schema.guild)
			.where(eq(schema.guild.id, guildId))
			.get();
		return data?.chatbotChannelId
			? {
					id: data.id,
					guildId: data.id,
					channelId: data.chatbotChannelId,
					createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
				}
			: null;
	}

	/**
	 * Create a new setup for a guild
	 * @param guildId The guild ID
	 * @param channelId The channel ID
	 * @param messageId The message ID
	 */
	public async createChatbotSetup(
		guildId: string,
		channelId: string,
	): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({
				id: guildId,
				chatbotChannelId: channelId,
			})
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: { chatbotChannelId: channelId },
			});
	}

	/**
	 * Delete a setup for a guild
	 * @param guildId The guild ID
	 */
	public async deleteChatbotSetup(guildId: string): Promise<void> {
		await this.db
			.update(schema.guild)
			.set({ chatbotChannelId: null })
			.where(eq(schema.guild.id, guildId))
			.catch(() => null); // Ignore if not found
	}

	/**
	 * Get all guilds with a global chat channel set
	 * @returns Array of objects containing guild id and globalChannelId
	 * @param none
	 */
	public async getAllGlobalChat(): Promise<
		Array<{
			id: string;
			globalChannelId: string;
			webhookId?: string;
			webhookToken?: string;
		}>
	> {
		const rows = await this.db
			.select()
			.from(schema.guild)
			.where(isNotNull(schema.guild.globalChannelId));
		return rows
			.filter((row) => typeof row.globalChannelId === "string")
			.map((row) => ({
				id: row.id,
				globalChannelId: row.globalChannelId as string,
				webhookId: row.globalWebhookId || undefined,
				webhookToken: row.globalWebhookToken || undefined,
			}));
	}

	/**
	 * Get the global chat channel for a guild
	 * @param guildId The guild ID
	 */
	public async getGlobalChatChannel(guildId: string): Promise<string | null> {
		const data = await this.db
			.select()
			.from(schema.guild)
			.where(eq(schema.guild.id, guildId))
			.get();
		return data?.globalChannelId ?? null;
	}

	/**
	 * Create the global chat channel for a guild
	 * @param guildId The guild ID
	 * @param channelId The channel ID
	 * @param webhookId Optional webhook ID
	 * @param webhookToken Optional webhook token
	 */
	public async createGlobalChatChannel(
		guildId: string,
		channelId: string,
		webhookId?: string,
		webhookToken?: string,
	): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({
				id: guildId,
				globalChannelId: channelId,
				globalWebhookId: webhookId,
				globalWebhookToken: webhookToken,
			})
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: {
					globalChannelId: channelId,
					globalWebhookId: webhookId,
					globalWebhookToken: webhookToken,
				},
			});
	}

	/**
	 * Delete the global chat channel for a guild
	 * @param guildId The guild ID
	 */
	public async deleteGlobalChatChannel(guildId: string): Promise<void> {
		await this.db
			.update(schema.guild)
			.set({
				globalChannelId: null,
				globalWebhookId: null,
				globalWebhookToken: null,
			})
			.where(eq(schema.guild.id, guildId))
			.catch(() => null);
	}

	/**
	 * Add or update a user's vote status
	 * @param userId The user ID
	 */
	public async addUserVote(userId: string): Promise<void> {
		const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
		const expiresAt = new Date(Date.now() + TWELVE_HOURS);
		const now = new Date().toISOString();

		await this.db.insert(schema.userVote).values({
			id: randomUUID(),
			userId,
			expiresAt: expiresAt.toISOString(),
			type: "vote",
			votedAt: now,
		});
	}

	/**
	 * Add regular premium access for a user
	 * @param userId The user ID
	 * @param durationMs Duration in milliseconds
	 */
	public async addRegularPremium(
		userId: string,
		durationMs: number,
	): Promise<void> {
		const expiresAt = new Date(Date.now() + durationMs);
		const now = new Date().toISOString();

		await this.db.insert(schema.userVote).values({
			id: randomUUID(),
			userId,
			expiresAt: expiresAt.toISOString(),
			type: "regular",
			votedAt: now,
		});
	}

	/**
	 * Add premium (vote or regular) for a user
	 * @param userId The user ID
	 * @param type 'vote' or 'regular'
	 * @param durationMs Duration in milliseconds (for 'regular'), ignored for 'vote'
	 */
	public async addPremium(
		userId: string,
		type: "vote" | "regular",
		durationMs?: number,
	): Promise<void> {
		const now = new Date().toISOString();
		let expiresAt: string;
		if (type === "regular") {
			if (!durationMs)
				throw new Error("durationMs is required for regular premium");
			expiresAt = new Date(Date.now() + durationMs).toISOString();
		} else {
			// vote premium: 12 hours
			expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
		}
		await this.db.insert(schema.userVote).values({
			id: randomUUID(),
			userId,
			expiresAt,
			type,
			votedAt: now,
		});
	}

	/**
	 * Check if a user has an active premium status
	 * @param userId The user ID
	 */
	public async hasActivePremium(userId: string): Promise<boolean> {
		const now = new Date().toISOString();
		const vote = await this.db
			.select()
			.from(schema.userVote)
			.where(
				and(
					eq(schema.userVote.userId, userId),
					gt(schema.userVote.expiresAt, now),
				),
			)
			.orderBy(desc(schema.userVote.expiresAt))
			.get();

		return !!vote;
	}

	/**
	 * Clean up expired premium entries
	 */
	public async cleanupExpiredVotes(): Promise<void> {
		await this.db
			.delete(schema.userVote)
			.where(eq(schema.userVote.expiresAt, new Date().toISOString()));
	}

	/**
	 * Get time remaining for premium status
	 * @param userId The user ID
	 */
	public async getPremiumTimeRemaining(userId: string): Promise<number | null> {
		const now = new Date().toISOString();

		// Check for regular premium first, then fall back to vote premium
		let vote = await this.db
			.select()
			.from(schema.userVote)
			.where(
				and(
					eq(schema.userVote.userId, userId),
					eq(schema.userVote.type, "regular"),
					gt(schema.userVote.expiresAt, now),
				),
			)
			.orderBy(desc(schema.userVote.expiresAt))
			.get();

		if (!vote) {
			// If no regular premium, check for vote premium
			vote = await this.db
				.select()
				.from(schema.userVote)
				.where(
					and(
						eq(schema.userVote.userId, userId),
						eq(schema.userVote.type, "vote"),
						gt(schema.userVote.expiresAt, now),
					),
				)
				.orderBy(desc(schema.userVote.expiresAt))
				.get();
		}

		if (!vote) return null;
		return new Date(vote.expiresAt).getTime() - Date.now();
	}

	/**
	 * Clear vote data for a specific user
	 * @param userId The user ID
	 */
	public async clearVoteData(userId: string): Promise<void> {
		await this.db
			.delete(schema.userVote)
			.where(eq(schema.userVote.userId, userId));
	}

	/**
	 * Clear premium data for a specific user
	 * @param userId The user ID
	 */
	public async clearPremiumData(userId: string): Promise<void> {
		await this.db
			.delete(schema.userVote)
			.where(
				and(
					eq(schema.userVote.userId, userId),
					eq(schema.userVote.type, "regular"),
				),
			);
	}

	/**
	 * Get vote statistics
	 * @param userId Optional user ID for specific user stats
	 */
	public async getVoteStats(userId?: string) {
		const query = this.db.select().from(schema.userVote);

		if (userId) {
			query.where(eq(schema.userVote.userId, userId));
		}

		const votes = await query.all();
		const activeVotes = votes.filter(
			(vote) => new Date(vote.expiresAt) > new Date(),
		);

		return {
			total: votes.length,
			active: activeVotes.length,
		};
	}

	/**
	 * Get premium statistics
	 * @param userId Optional user ID for specific user stats
	 */
	public async getPremiumStats(userId?: string) {
		const now = new Date().toISOString();
		if (userId) {
			// Check for regular premium first
			let premium = await this.db
				.select()
				.from(schema.userVote)
				.where(
					and(
						eq(schema.userVote.userId, userId),
						eq(schema.userVote.type, "regular"),
						gt(schema.userVote.expiresAt, now),
					),
				)
				.orderBy(desc(schema.userVote.expiresAt))
				.get();

			// If no regular premium, check for vote premium
			if (!premium) {
				premium = await this.db
					.select()
					.from(schema.userVote)
					.where(
						and(
							eq(schema.userVote.userId, userId),
							eq(schema.userVote.type, "vote"),
							gt(schema.userVote.expiresAt, now),
						),
					)
					.orderBy(desc(schema.userVote.expiresAt))
					.get();
			}

			return {
				active: !!premium,
				expiresAt: premium ? new Date(premium.expiresAt) : null,
				type: premium ? premium.type : null,
			};
		}

		// Get count of unique users with active premium
		const activeRegularUsers = await this.db
			.select()
			.from(schema.userVote)
			.where(
				and(
					eq(schema.userVote.type, "regular"),
					gt(schema.userVote.expiresAt, now),
				),
			)
			.groupBy(schema.userVote.userId)
			.all();

		const activeVoteUsers = await this.db
			.select()
			.from(schema.userVote)
			.where(
				and(
					eq(schema.userVote.type, "vote"),
					gt(schema.userVote.expiresAt, now),
				),
			)
			.groupBy(schema.userVote.userId)
			.all();

		return {
			activeRegularUsers: activeRegularUsers.length,
			activeVoteUsers: activeVoteUsers.length,
			totalActiveUsers: activeRegularUsers.length + activeVoteUsers.length,
		};
	}

	/**
	 * Set the guild locale to the database.
	 * @param guildId The guild id.
	 * @param locale The locale.
	 */
	public async setLocale(guildId: string, locale: string): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({ id: guildId, locale })
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: { locale },
			});
	}

	/**
	 * Get the chatbot locale for a guild from the database, or return default if not found.
	 * @param guildId Guild ID
	 * @returns chatbot locale string
	 */
	public async getChatbotLocale(guildId: string): Promise<string> {
		const data = await this.db
			.select()
			.from(schema.guild)
			.where(eq(schema.guild.id, guildId))
			.get();
		return data?.chatbotLocale ?? DEFAULT_LANGUAGE; // Use default from models
	}

	/**
	 * Set the guild chatbot locale to the database.
	 * @param guildId The guild id.
	 * @param locale The chatbot locale.
	 */
	public async setChatbotLocale(
		guildId: string,
		locale: string,
	): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({ id: guildId, chatbotLocale: locale })
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: { chatbotLocale: locale },
			});
	}

	/**
	 * Set the guild prefix to the database.
	 * @param guildId The guild id.
	 * @param prefix The prefix.
	 */
	public async setPrefix(guildId: string, prefix: string): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({ id: guildId, prefix })
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: { prefix },
			});
	}

	/**
	 * Delete the guild prefix from the database (reset to default).
	 * @param guildId The guild id.
	 */
	public async deletePrefix(guildId: string): Promise<void> {
		await this.db
			.insert(schema.guild)
			.values({ id: guildId, prefix: null })
			.onConflictDoUpdate({
				target: schema.guild.id,
				set: { prefix: null },
			});
	}
}

export const database = new AlyaDatabase();

export * from "./schema";
