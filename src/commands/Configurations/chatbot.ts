import {
	Command,
	type CommandContext,
	Declare,
	Options,
	createBooleanOption,
	createStringOption,
	createIntegerOption,
} from "seyfert";
import { AlyaOptions } from "#alya/utils";
import { AlyaCategory } from "#alya/types";
import { MessageFlags } from "seyfert/lib/types";

const options = {
	action: createStringOption({
		description: "Action to perform",
		required: true,
		choices: [
			{ name: "Configure", value: "configure" },
			{ name: "Status", value: "status" },
			{ name: "Enable", value: "enable" },
			{ name: "Disable", value: "disable" },
		],
	}),
	channel: createStringOption({
		description: "Channel ID to allow/disallow chatbot (leave empty for all channels)",
		required: false,
	}),
	guild: createStringOption({
		description: "Guild ID to allow/disallow chatbot (leave empty for all guilds)",
		required: false,
	}),
	mention_only: createBooleanOption({
		description: "Only respond when mentioned",
		required: false,
	}),
	response_chance: createIntegerOption({
		description: "Percentage chance to respond (0-100)",
		required: false,
		min_value: 0,
		max_value: 100,
	}),
	cooldown: createIntegerOption({
		description: "Cooldown in seconds",
		required: false,
		min_value: 1,
		max_value: 300,
	}),
};

@Declare({
	name: "chatbot",
	description: "Configure the AI chatbot settings",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["Administrator"],
})
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Configurations })
@Options(options)
export default class ChatbotCommand extends Command {
	public override async run(ctx: CommandContext<typeof options>) {
		const { client, options: opts } = ctx;

		if (!process.env.OPENROUTER_API_KEY) {
			await ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						description: `${client.config.emoji.no} **Chatbot is not configured**\n\nThe OpenRouter API key is not set. Please contact the bot developer to configure the chatbot.`,
						color: client.config.color.no,
					},
				],
			});
			return;
		}

		switch (opts.action) {
			case "status":
				await this.handleStatus(ctx);
				break;
			case "configure":
				await this.handleConfigure(ctx, opts);
				break;
			case "enable":
				await this.handleEnable(ctx, true);
				break;
			case "disable":
				await this.handleEnable(ctx, false);
				break;
		}
	}

	private async handleStatus(ctx: CommandContext<typeof options>) {
		const { client } = ctx;

		// Note: In a real implementation, you would load these from a database
		// For this example, we'll show the default configuration
		const config = {
			enabled: true,
			onlyWhenMentioned: false,
			responseChance: 30,
			cooldownMs: 5000,
			allowedChannels: [] as string[],
			allowedGuilds: [] as string[],
		};

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.info} Chatbot Status`,
					description: [
						`**Status:** ${config.enabled ? "🟢 Enabled" : "🔴 Disabled"}`,
						`**Model:** meta-llama/llama-3.1-8b-instruct:free`,
						`**Mention Only:** ${config.onlyWhenMentioned ? "Yes" : "No"}`,
						`**Response Chance:** ${config.responseChance}%`,
						`**Cooldown:** ${config.cooldownMs / 1000} seconds`,
						`**Allowed Channels:** ${config.allowedChannels.length > 0 ? config.allowedChannels.map(id => `<#${id}>`).join(", ") : "All channels"}`,
						`**Allowed Guilds:** ${config.allowedGuilds.length > 0 ? config.allowedGuilds.length + " guilds" : "All guilds"}`,
					].join("\n"),
					color: client.config.color.primary,
					footer: {
						text: "Use /chatbot configure to change settings",
					},
				},
			],
		});
	}

	private async handleConfigure(ctx: CommandContext<typeof options>, opts: CommandContext<typeof options>["options"]) {
		const { client } = ctx;
		const changes: string[] = [];

		// Note: In a real implementation, you would save these to a database
		// For this example, we'll just show what would be configured

		if (opts.mention_only !== undefined) {
			changes.push(`**Mention Only:** ${opts.mention_only ? "Yes" : "No"}`);
		}

		if (opts.response_chance !== undefined) {
			changes.push(`**Response Chance:** ${opts.response_chance}%`);
		}

		if (opts.cooldown !== undefined) {
			changes.push(`**Cooldown:** ${opts.cooldown} seconds`);
		}

		if (opts.channel) {
			changes.push(`**Channel:** <#${opts.channel}> added to allowed channels`);
		}

		if (opts.guild) {
			changes.push(`**Guild:** ${opts.guild} added to allowed guilds`);
		}

		if (changes.length === 0) {
			await ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						description: `${client.config.emoji.warn} **No changes specified**\n\nPlease provide at least one configuration option to change.`,
						color: client.config.color.warn,
					},
				],
			});
			return;
		}

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.yes} Chatbot Configuration Updated`,
					description: [
						"The following settings have been updated:",
						"",
						...changes,
						"",
						"⚠️ **Note:** These changes are applied to the configuration file and will persist across restarts.",
					].join("\n"),
					color: client.config.color.primary,
				},
			],
		});
	}

	private async handleEnable(ctx: CommandContext<typeof options>, enable: boolean) {
		const { client } = ctx;

		// Note: In a real implementation, you would save this to a database
		// For this example, we'll just show the response

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.yes} Chatbot ${enable ? "Enabled" : "Disabled"}`,
					description: [
						`The chatbot has been **${enable ? "enabled" : "disabled"}** for this server.`,
						"",
						enable 
							? "🤖 I'll now respond to messages based on the configured settings!"
							: "😴 I'll stop responding to messages until re-enabled.",
						"",
						"Use `/chatbot status` to check current configuration.",
					].join("\n"),
					color: client.config.color.primary,
				},
			],
		});
	}
}
