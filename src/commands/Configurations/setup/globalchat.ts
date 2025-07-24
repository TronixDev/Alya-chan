import {
	SubCommand,
	type CommandContext,
	Declare,
	Options,
	createChannelOption,
} from "seyfert";
import { AlyaOptions } from "#alya/utils";
import { AlyaCategory } from "#alya/types";
import {
	ChannelType,
	MessageFlags,
	PermissionFlagsBits,
	OverwriteType,
} from "seyfert/lib/types";

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
export default class GlobalChatSetupCommand extends SubCommand {
	public override async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		if (!guildId) return;

		await ctx.deferReply();

		// Check existing setup from API
		try {
			const response = await fetch(`${client.config.globalChat.apiUrl}/list`);
			const data = await response.json();
			const existingGuild = data.guilds?.find(
				(g: { id: string; globalChannelId: string }) => g.id === guildId,
			);

			if (existingGuild) {
				await ctx.editOrReply({
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} Global chat channel is already set: <#${existingGuild.globalChannelId}>`,
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
						description: `${client.config.emoji.no} Unable to verify existing setup. Please try again later.`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		let channelId: string | undefined;
		if (options.channel) {
			channelId = options.channel.id;
			// If user provided a channel, create webhook for it
			const webhook = await client.webhooks.create(channelId, {
				name: client.config.globalChat.webhookName,
				avatar: client.me.avatarURL(),
			});
			// Kirim data ke API
			await fetch(`${client.config.globalChat.apiUrl}/add`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
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
							description: `${client.config.emoji.no} Unable to fetch guild data. Please try again later.`,
						},
					],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			const channel = await guild.channels.create({
				name: "🌏・global-chat",
				type: ChannelType.GuildText,
				topic: `${client.config.globalChat.webhookName} - Interact with users from other servers!`,
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

			// Create webhook for global chat
			const webhook = await client.webhooks.create(channel.id, {
				name: client.config.globalChat.webhookName,
				avatar: client.me.avatarURL(),
			});

			// Send setup message to the created channel
			await client.messages.write(channel.id, {
				embeds: [
					{
						title: `${client.config.emoji.globe} Global Chat Setup`,
						description:
							"This is your new global chat channel! Interact with users from other servers.",
						// image: { url: client.config.info.banner },
						color: client.config.color.primary,
						timestamp: new Date().toISOString(),
					},
				],
			});

			// Kirim data ke API
			await fetch(`${client.config.globalChat.apiUrl}/add`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
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
					description: `${client.config.emoji.yes} Global chat channel successfully set: <#${channelId}>`,
				},
			],
			flags: MessageFlags.Ephemeral,
		});
	}
}
