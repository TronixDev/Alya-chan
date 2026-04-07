import ky from "ky";
import type { Message, UsingClient } from "seyfert";
import type { FailedGuild, GlobalChatApiResponse } from "#alya/types";
import { handleFailedGuilds } from "#alya/utils";

export async function handleGlobalChat(
	message: Message,
	client: UsingClient,
): Promise<void> {
	if (!client.config.globalChat?.enabled) return;

	if (message.author.bot) return;
	const guild = await message.guild();
	if (!guild) return;

	const globalChatHeaders: Record<string, string> = {};
	if (client.config.globalChat?.apiKey) {
		globalChatHeaders.Authorization = `Bearer ${client.config.globalChat.apiKey}`;
	}

	try {
		const safeMessage = {
			id: message.id,
			content: message.content,
			author: {
				id: message.author.id,
				username: message.author.username,
				globalName: message.author.globalName,
				avatarURL: message.author.avatarURL(),
			},
			channelId: message.channelId,
			guildId: message.guildId,
			referencedMessage: message.referencedMessage
				? {
						id: message.referencedMessage.id,
						content: message.referencedMessage.content,
						author: {
							id: message.referencedMessage.author.id,
							username: message.referencedMessage.author.username,
							globalName: message.referencedMessage.author.globalName,
						},
					}
				: null,
			attachments: message.attachments?.map((a) => ({
				url: a.url,
				contentType: a.contentType,
			})),
			stickerItems: message.stickerItems?.map((s) => ({
				id: s.id,
				name: s.name,
				formatType: s.formatType,
			})),
		};

		const result = (await ky
			.post(`${client.config.globalChat.apiUrl}/chat`, {
				headers: globalChatHeaders,
				json: {
					message: safeMessage,
					guildName: guild.name,
				},
				throwHttpErrors: false,
			})
			.json()) as GlobalChatApiResponse;

		switch (result.status) {
			case "ok":
				client.logger.info(
					`Message broadcasted successfully to ${result.data?.deliveryStats?.total || 0} servers`,
				);
				client.logger.info(
					`Success rate: ${result.data?.deliveryStats?.successRate || 0}%`,
				);
				break;

			case "ignored":
				client.logger.info(
					`Message ignored: ${result.data?.reason || "Not from global chat channel"}`,
				);

				break;

			case "skipped":
				break;

			case "partial": {
				client.logger.info(
					`Partially delivered: ${result.data?.deliveryStats?.successful || 0}/${result.data?.deliveryStats?.total || 0}`,
				);
				const partialFailed = result.data?.failedGuilds;
				if (partialFailed && partialFailed.length > 0) {
					const failedGuildNames = partialFailed
						.map((g: FailedGuild) => g.guildName)
						.join(", ");
					client.logger.warn(`Failed guilds: ${failedGuildNames}`);

					await handleFailedGuilds(partialFailed, client);
				}
				break;
			}

			case "failed": {
				client.logger.error(
					`All deliveries failed for message ${safeMessage.id}`,
				);
				const allFailed = result.data?.failedGuilds;
				if (allFailed && allFailed.length > 0) {
					const failedGuildErrors = allFailed
						.map((g: FailedGuild) => g.error)
						.join("; ");
					client.logger.error(`Failed guilds: ${failedGuildErrors}`);

					await handleFailedGuilds(allFailed, client);
				}
				break;
			}

			default:
				client.logger.warn(`Unknown response status: ${result.status}`);
				client.logger.info("Full response:", result);
		}

		if (result.status === "ok" || result.status === "partial") {
			client.logger.info(`📤 From guild: ${guild.name} (${guild.id})`);
		}
	} catch (apiError) {
		client.logger.error("Failed to send global chat to API:", apiError);
	}
}
