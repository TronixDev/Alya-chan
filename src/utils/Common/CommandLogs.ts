import ky, { type KyResponse } from "ky";
import { Embed, type UsingClient } from "seyfert";

/**
 * Send command log to webhook
 * @param client - The client instance
 * @param data - The command data
 * @returns Webhook HTTP response from ky.
 */
export async function sendCommandLog(
	client: UsingClient,
	data: {
		guildName?: string;
		guildId?: string;
		channelName?: string;
		channelId: string;
		commandName: string;
		commandType: "Prefix/Mentions" | "Slash";
		userId: string;
		username: string;
		displayName?: string;
		prefix?: string;
	},
): Promise<KyResponse> {
	const embed = new Embed()
		.setColor(client.config.color.primary)
		.setTitle("Command Logger")
		.setDescription(
			`Command executed by **${data.displayName ?? data.username}**`,
		)
		.addFields([
			{
				name: "Server Name",
				value: `${data.guildName ?? "Direct Message"} \`(${data.guildId ?? "DM"})\``,
				inline: false,
			},
			{
				name: "Channel Name",
				value: `${data.channelName ?? "Unknown"} \`(${data.channelId})\``,
				inline: false,
			},
			{
				name: "Type",
				value: `${data.commandType}`,
				inline: false,
			},
			{
				name: "Command",
				value:
					data.commandType === "Prefix/Mentions"
						? `\`\`\`js\n${data.prefix}${data.commandName}\`\`\``
						: `\`\`\`js\n${data.commandName}\`\`\``,
				inline: false,
			},
			{
				name: "User Information",
				value: `\`${data.username} (${data.userId})\``,
				inline: false,
			},
		])
		.setTimestamp();

	return ky.post(`${client.config.webhooks.commandLog}?wait=true`, {
		headers: {
			"Content-Type": "application/json",
		},
		json: {
			username: client.me.username,
			avatar_url: client.me.avatarURL(),
			embeds: [embed.toJSON()],
		},
		throwHttpErrors: false,
	});
}
