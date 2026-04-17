import ky from "ky";
import type { UsingClient } from "seyfert";
import type { FailedGuild, GlobalChatGuildInfoResponse } from "#alya/types";
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

			const data = (await ky
				.get(
					`${client.config.globalChat.apiUrl}/guild/${failedGuild.guildId}`,
					{
						headers,
						throwHttpErrors: false,
					},
				)
				.json()) as GlobalChatGuildInfoResponse;

			if (!data.data?.guild?.global_channel_id) {
				client.logger.warn(
					`❌ Could not find global channel info for ${failedGuild.guildId}`,
				);
				continue;
			}

			const webhooks = await ensureWebhooks(
				client,
				failedGuild.guildId,
				data.data.guild.global_channel_id,
			);

			const updateResult = (await ky
				.post(`${client.config.globalChat.apiUrl}/add`, {
					headers,
					json: {
						guild_id: failedGuild.guildId,
						global_channel_id: data.data.guild.global_channel_id,
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
