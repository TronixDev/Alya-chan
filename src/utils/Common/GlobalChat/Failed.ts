import ky from "ky";
import type { UsingClient } from "seyfert";
import type { FailedGuild } from "#alya/types";
import { ensureWebhooks } from "./Utils";

export async function handleFailedGuilds(
	failedGuilds: FailedGuild[],
	client: UsingClient,
): Promise<void> {
	const headers = {
		...(client.config.globalChat?.apiKey && {
			Authorization: `Bearer ${client.config.globalChat.apiKey}`,
		}),
	};

	for (const failedGuild of failedGuilds) {
		try {
			client.logger.info(
				`🔧 Attempting to fix webhooks for guild ${failedGuild.guildName} (${failedGuild.guildId})`,
			);

			const guildData = (await ky
				.get(`${client.config.globalChat.apiUrl}/list`, {
					headers,
					throwHttpErrors: false,
				})
				.json()) as {
				data?: { guilds?: Array<{ id: string; global_channel_id?: string }> };
			};

			const guildInfo = guildData.data?.guilds?.find(
				(g) => g.id === failedGuild.guildId,
			);

			if (!guildInfo?.global_channel_id) {
				client.logger.warn(
					`❌ Could not find global channel info for ${failedGuild.guildId}`,
				);
				continue;
			}

			const webhooks = await ensureWebhooks(
				client,
				failedGuild.guildId,
				guildInfo.global_channel_id,
			);

			const updateResult = (await ky
				.post(`${client.config.globalChat.apiUrl}/add`, {
					headers,
					json: {
						guild_id: failedGuild.guildId,
						global_channel_id: guildInfo.global_channel_id,
						webhooks,
					},
					throwHttpErrors: false,
				})
				.json()) as { status?: string };

			if (updateResult.status === "ok") {
				client.logger.info(
					`✅ Successfully fixed webhooks for guild ${failedGuild.guildName}`,
				);
			} else {
				client.logger.error(
					`❌ Failed to update webhooks for guild ${failedGuild.guildName} in API`,
				);
			}
		} catch (error) {
			client.logger.error(
				`❌ Error fixing webhooks for guild ${failedGuild.guildName}:`,
				error,
			);
		}
	}
}
