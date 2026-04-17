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
			if (dbWh) {
				validWebhooks.push({ id: dbWh.id, token: dbWh.token });
			}
		}
		if (validWebhooks.length >= 3) break;
	}

	if (validWebhooks.length < 3) {
		const toCreate = 3 - validWebhooks.length;
		for (let i = 0; i < toCreate; i++) {
			const webhook = await client.webhooks.create(channelId, {
				name: `${client.config.globalChat.webhookName} ${validWebhooks.length + 1}`,
				avatar: client.me.avatarURL(),
			});
			if (webhook.token) {
				const whData = { id: webhook.id, token: webhook.token };
				validWebhooks.push(whData);
				await client.database.addGuildWebhook(guildId, whData.id, whData.token);
			}
		}
	}

	return validWebhooks.slice(0, 3);
}
