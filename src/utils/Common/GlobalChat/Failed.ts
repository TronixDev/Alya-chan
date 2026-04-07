import ky from "ky";
import type { UsingClient } from "seyfert";
import type { FailedGuild } from "#alya/types";

export async function handleFailedGuilds(
	failedGuilds: FailedGuild[],
	client: UsingClient,
): Promise<void> {
	const globalChatHeaders: Record<string, string> = {};
	if (client.config.globalChat?.apiKey) {
		globalChatHeaders.Authorization = `Bearer ${client.config.globalChat.apiKey}`;
	}
	for (const failedGuild of failedGuilds) {
		try {
			client.logger.info(
				`🔧 Attempting to fix webhook for guild ${failedGuild.guildName} (${failedGuild.guildId})`,
			);

			const guildData = (await ky
				.get(`${client.config.globalChat.apiUrl}/list`, {
					headers: globalChatHeaders,
					throwHttpErrors: false,
				})
				.json()) as {
				data?: { guilds?: Array<{ id: string; globalChannelId?: string }> };
			};
			const guildInfo = guildData.data?.guilds?.find(
				(g: { id: string }) => g.id === failedGuild.guildId,
			);

			if (!guildInfo?.globalChannelId) {
				client.logger.warn(
					`❌ Could not find guild info for ${failedGuild.guildId}`,
				);
				continue;
			}

			const webhook = await client.webhooks.create(guildInfo.globalChannelId, {
				name: client.config.globalChat.webhookName,
				avatar: client.me.avatarURL(),
			});

			const updateResult = (await ky
				.post(`${client.config.globalChat.apiUrl}/add`, {
					headers: globalChatHeaders,
					json: {
						guildId: failedGuild.guildId,
						globalChannelId: guildInfo.globalChannelId,
						webhookId: webhook.id,
						webhookToken: webhook.token,
					},
					throwHttpErrors: false,
				})
				.json()) as { status?: string };

			if (updateResult.status === "ok") {
				client.logger.info(
					`✅ Successfully fixed webhook for guild ${failedGuild.guildName}`,
				);
			} else {
				client.logger.error(
					`❌ Failed to update guild ${failedGuild.guildName} in API:`,
				);
			}
		} catch {
			client.logger.error(
				`❌ Failed to fix webhook for guild ${failedGuild.guildName}:`,
			);
		}
	}
}
