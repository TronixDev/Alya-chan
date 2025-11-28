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

			const guildResponse = await fetch(
				`${client.config.globalChat.apiUrl}/list`,
				{
					headers: globalChatHeaders,
				},
			);
			const guildData = await guildResponse.json();
			const guildInfo = guildData.data?.guilds?.find(
				(g: { id: string }) => g.id === failedGuild.guildId,
			);

			if (!guildInfo || !guildInfo.globalChannelId) {
				client.logger.warn(
					`❌ Could not find guild info for ${failedGuild.guildId}`,
				);
				continue;
			}

			const webhook = await client.webhooks.create(guildInfo.globalChannelId, {
				name: client.config.globalChat.webhookName,
				avatar: client.me.avatarURL(),
			});

			const postHeaders = {
				"Content-Type": "application/json",
				...globalChatHeaders,
			};
			const updateResponse = await fetch(
				`${client.config.globalChat.apiUrl}/add`,
				{
					method: "POST",
					headers: postHeaders,
					body: JSON.stringify({
						guildId: failedGuild.guildId,
						globalChannelId: guildInfo.globalChannelId,
						webhookId: webhook.id,
						webhookToken: webhook.token,
					}),
				},
			);

			const updateResult = await updateResponse.json();

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
