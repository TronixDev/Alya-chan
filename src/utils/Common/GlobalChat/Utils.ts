import type { UsingClient } from "seyfert";

export async function ensureWebhooks(
	client: UsingClient,
	guildId: string,
	channelId: string,
): Promise<Array<{ id: string; token: string }>> {
	const dbWebhooks = await client.database.getGuildWebhooks(guildId);

	const channelWebhooks = await client.proxy.channels(channelId).webhooks.get();

	const validWebhooks: Array<{ id: string; token: string }> = [];

	for (const botWh of channelWebhooks) {
		if (botWh.application_id === client.applicationId) {
			const dbWh = dbWebhooks.find((dw) => dw.id === botWh.id);
			if (dbWh && validWebhooks.length < 3) {
				validWebhooks.push({ id: dbWh.id, token: dbWh.token });
			} else {
				// Delete orphaned or excess bot webhooks
				try {
					await client.proxy.webhooks(botWh.id).delete();
				} catch (error) {
					client.logger.error(
						`Failed to delete redundant webhook ${botWh.id}:`,
						error,
					);
				}
			}
		}
	}

	if (validWebhooks.length < 3) {
		const toCreate = 3 - validWebhooks.length;
		for (let i = 0; i < toCreate; i++) {
			try {
				const webhook = await client.webhooks.create(channelId, {
					name: `${client.config.globalChat.webhookName} ${validWebhooks.length + 1}`,
					avatar: client.me.avatarURL(),
				});
				if (webhook.token) {
					const whData = { id: webhook.id, token: webhook.token };
					validWebhooks.push(whData);
					await client.database.addGuildWebhook(
						guildId,
						whData.id,
						whData.token,
					);
				}
			} catch (error) {
				client.logger.error("Failed to create new webhook:", error);
			}
		}
	}

	return validWebhooks.slice(0, 3);
}
