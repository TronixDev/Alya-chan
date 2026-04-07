import { Client, LimitedCollection } from "seyfert";
import { HandleCommand } from "seyfert/lib/commands/handle";
import { ActivityType, PresenceUpdateStatus } from "seyfert/lib/types";
import { Yuna } from "yunaforseyfert";
import { Configuration } from "#alya/config";
import { AlyaDatabase } from "#alya/db";
import { AlyaMiddlewares } from "#alya/middlewares";
import type { AlyaConfiguration } from "#alya/types";
import {
	AlyaCache,
	AlyaContext,
	DEBUG_MODE,
	getWatermark,
	handleMention,
	isBotMention,
	onBotPermissionsFail,
	onInternalError,
	onMiddlewaresError,
	onOptionsError,
	onPermissionsFail,
	onRunError,
	sendCommandLog,
} from "#alya/utils";
import { AlyaManager } from "./modules/Manager";

// Ganti dengan pesan custom jika ingin efek "thinking"
const THINK_MESSAGES = ["is thinking..."];

/**
 * Main Alya class.
 */
export default class Alya extends Client<true> {
	/**
	 * Alya cooldowns collection.
	 */
	public readonly cooldowns: LimitedCollection<string, number> =
		new LimitedCollection();

	/**
	 * Alya configuration.
	 */
	public readonly config: AlyaConfiguration = Configuration;

	/**
	 * The timestamp when Alya is ready.
	 */
	public readyTimestamp = 0;

	/**
	 * Alya manager instance.
	 */
	public readonly manager: AlyaManager;

	/**
	 * Alya database instance.
	 */
	public readonly database: AlyaDatabase;

	/**
	 * Alya cache instance.
	 */
	public readonly alyaCache: AlyaCache;

	/**
	 * Create a new Alya instance.
	 */
	constructor() {
		super({
			context: AlyaContext,
			globalMiddlewares: [
				"checkDevMode",
				"checkCooldown",
				"checkVerifications",
				"checkPremium",
			],
			allowedMentions: {
				replied_user: false,
				parse: [], // ! ["roles", "users"], - if enabled, bot can mention roles and users
			},
			components: {
				defaults: {
					onRunError,
				},
			},
			commands: {
				reply: () => true,
				prefix: async (message) => {
					const prefixes = [
						await this.database.getPrefix(message.guildId ?? ""),
					];
					if (
						message?.mentions?.users?.some(
							(user) => "id" in user && user.id === this.me.id,
						)
					) {
						prefixes.push(`<@${this.me.id}>`, `<@!${this.me.id}>`);
					}
					if (isBotMention(message, this.me.id)) {
						handleMention(this, message, prefixes);
					}

					// Check if message starts with any of the prefixes
					const usedPrefix = prefixes.find((prefix) =>
						message.content.startsWith(prefix),
					);
					if (usedPrefix) {
						const commandName = message.content
							.slice(usedPrefix.length)
							.trim()
							.split(" ")[0];
						if (commandName) {
							// *Format the prefix for logging - convert mention ID to @BotName format
							let logPrefix: string;
							if (
								usedPrefix.startsWith("<@") ||
								usedPrefix === `@${this.me.username}`
							) {
								logPrefix = `@${this.me.username} `;
							} else {
								logPrefix = usedPrefix;
							}

							await sendCommandLog(this, {
								guildName: message.guild?.name,
								guildId: message.guildId,
								channelName: message.channel.name,
								channelId: message.channelId,
								commandName,
								commandType: "Prefix/Mentions",
								userId: message.author.id,
								username: message.author.username,
								displayName: message.member?.displayName,
								prefix: logPrefix,
							});
						}
					}
					return prefixes.map((p) => p.toLowerCase());
				},
				defaults: {
					onRunError,
					onPermissionsFail,
					onBotPermissionsFail,
					onInternalError,
					onMiddlewaresError,
					onOptionsError,
				},
				deferReplyResponse: ({ client }) => {
					return {
						content: `${client.config.emoji.think} **${client.me.username}** ${THINK_MESSAGES[Math.floor(Math.random() * THINK_MESSAGES.length)]}`,
					};
				},
			},
			presence: () => ({
				afk: false,
				since: Date.now(),
				status: PresenceUpdateStatus.Idle,
				activities: [{ name: "Traveling... 🌠", type: ActivityType.Playing }],
			}),
		});
		this.manager = new AlyaManager(this);
		this.database = new AlyaDatabase();
		this.alyaCache = new AlyaCache();
		this.run();
	}

	/**
	 * Start the main Alya process.
	 */
	private async run(): Promise<"🌟"> {
		getWatermark();
		this.commands.onCommand = (file) => {
			const command = new file();
			return command;
		};
		this.setServices({
			middlewares: AlyaMiddlewares,
			cache: {
				disabledCache: {
					bans: true,
					emojis: true,
					stickers: true,
					roles: true,
					presences: true,
					stageInstances: true,
				},
			},
			handleCommand: class extends HandleCommand {
				override argsParser = Yuna.parser({
					logResult: DEBUG_MODE,
					syntax: {
						namedOptions: ["-", "--"],
					},
				});
				override resolveCommandFromContent = Yuna.resolver({
					client: this.client,
					logResult: DEBUG_MODE,
				});
			},
			langs: {
				default: this.config.defaultLocale,
				aliases: {
					"es-419": ["es-ES"],
				},
			},
		});
		await this.start();
		await this.manager.load();
		return "🌟";
	}

	/**
	 * Reload Alya...
	 */
	public async reload(): Promise<void> {
		this.logger.warn("Attemping to reload...");
		try {
			await this.events?.reloadAll();
			await this.commands?.reloadAll();
			await this.components?.reloadAll();
			await this.langs?.reloadAll();
			// await this.manager.handler.reloadAll(); // Tidak ada method ini, hapus
			// await this.uploadCommands({ cachePath: this.config.cache.filename }); // Pastikan config.cache.filename ada jika ingin pakai
			this.logger.info("Alya has been reloaded.");
		} catch (error) {
			this.logger.error("Error -", error);
			throw error;
		}
	}
}
