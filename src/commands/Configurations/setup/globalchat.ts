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
import { AlyaOptions } from "#alya/utils";

const option = {
	channel: createChannelOption({
		description: "Select a channel for global chat (optional)",
		required: false,
		channel_types: [ChannelType.GuildText],
	}),
};

@Declare({
	name: "globalchat",
	description: "Setup global chat channel for cross-server interaction",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@AlyaOptions({ cooldown: 10, category: AlyaCategory.Configurations })
@Options(option)
@LocalesT(
	"cmd.setup.sub.globalchat.name",
	"cmd.setup.sub.globalchat.description",
)
export default class GlobalChatSetupCommand extends SubCommand {
	public override async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		const { cmd } = await ctx.getLocale();
		if (!guildId) return;

		const globalChatHeaders: Record<string, string> = {};
		if (client.config.globalChat?.apiKey) {
			globalChatHeaders.Authorization = `Bearer ${client.config.globalChat.apiKey}`;
		}

		await ctx.deferReply();

		try {
			const response = await fetch(`${client.config.globalChat.apiUrl}/list`, {
				headers: globalChatHeaders,
			});
			const data = await response.json();
			const existingGuild = data.guilds?.find(
				(g: { id: string; globalChannelId: string }) => g.id === guildId,
			);

			if (existingGuild) {
				await ctx.editOrReply({
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} ${cmd.setup.sub.globalchat.run.already_set({ channelId: existingGuild.globalChannelId })}`,
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
						description: `${client.config.emoji.no} ${cmd.setup.sub.globalchat.run.api_check_failed}`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		let channelId: string | undefined;
		if (options.channel) {
			channelId = options.channel.id;

			const webhook = await client.webhooks.create(channelId, {
				name: client.config.globalChat.webhookName,
				avatar: client.me.avatarURL(),
			});

			const postHeaders = {
				"Content-Type": "application/json",
				...globalChatHeaders,
			};
			await fetch(`${client.config.globalChat.apiUrl}/add`, {
				method: "POST",
				headers: postHeaders,
				body: JSON.stringify({
					guildId: guildId,
					globalChannelId: channelId,
					webhookId: webhook.id,
					webhookToken: webhook.token,
				}),
			});
		} else {
			const guild = await ctx.guild();
			if (!guild) {
				await ctx.editOrReply({
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} ${cmd.setup.sub.globalchat.run.guild_fetch_failed}`,
						},
					],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			const channel = await guild.channels.create({
				name: `${client.config.emoji.globe}・global-chat`,
				type: ChannelType.GuildText,
				topic: `${client.config.globalChat.webhookName} - ${cmd.setup.sub.globalchat.run.channel_topic}`,
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

			const webhook = await client.webhooks.create(channel.id, {
				name: client.config.globalChat.webhookName,
				avatar: client.me.avatarURL(),
			});

			await client.messages.write(channel.id, {
				embeds: [
					{
						title: `${client.config.emoji.globe} ${cmd.setup.sub.globalchat.run.embed_title}`,
						description: cmd.setup.sub.globalchat.run.embed_desc,

						color: client.config.color.primary,
						timestamp: new Date().toISOString(),
					},
				],
			});

			const postHeaders = {
				"Content-Type": "application/json",
				...globalChatHeaders,
			};
			await fetch(`${client.config.globalChat.apiUrl}/add`, {
				method: "POST",
				headers: postHeaders,
				body: JSON.stringify({
					guildId: guildId,
					globalChannelId: channelId,
					webhookId: webhook.id,
					webhookToken: webhook.token,
				}),
			});
		}

		await ctx.editOrReply({
			embeds: [
				{
					color: client.config.color.yes,
					description: `${client.config.emoji.yes} ${cmd.setup.sub.globalchat.run.success({ channelId })}`,
				},
			],
			flags: MessageFlags.Ephemeral,
		});
	}
}
