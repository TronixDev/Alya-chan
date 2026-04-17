import ky from "ky";
import {
	type CommandContext,
	createChannelOption,
	Declare,
	LocalesT,
	Options,
	SubCommand,
} from "seyfert";
import {
	ChannelType,
	MessageFlags,
	OverwriteType,
	PermissionFlagsBits,
} from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions, ensureWebhooks } from "#alya/utils";

const option = {
	channel: createChannelOption({
		description: "Select a channel for global chat (optional)",
		required: false,
		channel_types: [ChannelType.GuildText],
		locales: {
			name: "cmd.globalchat.sub.setup.options.channel.name",
			description: "cmd.globalchat.sub.setup.options.channel.description",
		},
	}),
};

@Declare({
	name: "setup",
	description: "Setup global chat channel for cross-server interaction",
})
@AlyaOptions({ cooldown: 10, category: AlyaCategory.Configurations })
@Options(option)
@LocalesT(
	"cmd.globalchat.sub.setup.name",
	"cmd.globalchat.sub.setup.description",
)
export default class GlobalChatSetupCommand extends SubCommand {
	public override async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		const { cmd } = await ctx.getLocale();
		if (!guildId) return;

		const headers = {
			...(client.config.globalChat?.apiKey && {
				Authorization: `Bearer ${client.config.globalChat.apiKey}`,
			}),
		};

		await ctx.deferReply();

		try {
			const data = (await ky
				.get(`${client.config.globalChat.apiUrl}/list`, {
					headers,
					throwHttpErrors: false,
				})
				.json()) as {
				guilds?: Array<{ id: string; globalChannelId: string }>;
			};
			const existingGuild = data.guilds?.find((g) => g.id === guildId);

			if (existingGuild) {
				await ctx.editOrReply({
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} ${cmd.globalchat.sub.setup.run.already_set({ channelId: existingGuild.globalChannelId })}`,
						},
					],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
		} catch (error) {
			console.error("Failed to check existing guild from API:", error);
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.globalchat.sub.setup.run.api_check_failed}`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		let channelId: string | undefined;
		let webhooks: Array<{ id: string; token: string }> = [];

		if (options.channel) {
			channelId = options.channel.id;
			webhooks = await ensureWebhooks(client, guildId, channelId);

			await client.database.createGlobalChatChannel(
				guildId,
				channelId,
				webhooks,
			);

			await ky.post(`${client.config.globalChat.apiUrl}/add`, {
				headers,
				json: {
					guild_id: guildId,
					global_channel_id: channelId,
					webhooks,
				},
				throwHttpErrors: false,
			});
		} else {
			const guild = await ctx.guild();
			if (!guild) {
				await ctx.editOrReply({
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} ${cmd.globalchat.sub.setup.run.guild_fetch_failed}`,
						},
					],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			const channel = await guild.channels.create({
				name: "🌏・global-chat",
				type: ChannelType.GuildText,
				topic: `${client.config.globalChat.webhookName} - ${cmd.globalchat.sub.setup.run.channel_topic}`,
				permission_overwrites: [
					{
						id: client.me.id,
						type: OverwriteType.Member,
						allow: (
							PermissionFlagsBits.ViewChannel |
							PermissionFlagsBits.SendMessages |
							PermissionFlagsBits.EmbedLinks |
							PermissionFlagsBits.ReadMessageHistory |
							PermissionFlagsBits.ManageMessages
						).toString(),
					},
					{
						id: guildId,
						type: OverwriteType.Role,
						allow: (
							PermissionFlagsBits.ViewChannel |
							PermissionFlagsBits.SendMessages |
							PermissionFlagsBits.ReadMessageHistory
						).toString(),
					},
				],
			});

			channelId = channel.id;
			webhooks = await ensureWebhooks(client, guildId, channelId);

			await client.messages.write(channel.id, {
				embeds: [
					{
						title: `${client.config.emoji.globe} ${cmd.globalchat.sub.setup.run.embed_title}`,
						description: cmd.globalchat.sub.setup.run.embed_desc,
						color: client.config.color.primary,
						timestamp: new Date().toISOString(),
					},
				],
			});

			await client.database.createGlobalChatChannel(
				guildId,
				channel.id,
				webhooks,
			);

			await ky.post(`${client.config.globalChat.apiUrl}/add`, {
				headers,
				json: {
					guild_id: guildId,
					global_channel_id: channelId,
					webhooks,
				},
				throwHttpErrors: false,
			});
		}

		await ctx.editOrReply({
			embeds: [
				{
					color: client.config.color.yes,
					description: `${client.config.emoji.yes} ${cmd.globalchat.sub.setup.run.success({ channelId })}`,
				},
			],
			flags: MessageFlags.Ephemeral,
		});
	}
}
