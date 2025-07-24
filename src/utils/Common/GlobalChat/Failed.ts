import type { UsingClient } from "seyfert";
import type { FailedGuild } from "#alya/types";

export async function handleFailedGuilds(
	failedGuilds: FailedGuild[],
	client: UsingClient,
): Promise<void> {
	for (const failedGuild of failedGuilds) {
		try {
			client.logger.info(
				`🔧 Attempting to fix webhook for guild ${failedGuild.guildName} (${failedGuild.guildId})`,
			);

			// Get guild information from API to get globalChannelId
			const guildResponse = await fetch(
				`${client.config.globalChat.apiUrl}/list`,
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

			// Try to create a new webhook
			const webhook = await client.webhooks.create(guildInfo.globalChannelId, {
				name: "Alya Global Chat",
				avatar: client.me.avatarURL(),
			});

			// Register/update the guild with new webhook info
			const updateResponse = await fetch(
				`${client.config.globalChat.apiUrl}/add`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
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
					updateResult,
				);
			}
		} catch (error) {
			client.logger.error(
				`❌ Failed to fix webhook for guild ${failedGuild.guildName}:`,
				error,
			);
		}
	}
}
