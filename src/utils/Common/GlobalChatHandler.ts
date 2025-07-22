import {
	Container,
	Section,
	Separator,
	TextDisplay,
	Thumbnail,
	type Message,
	type UsingClient,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

export interface GlobalChatGuild {
	id: string;
	globalChannelId: string;
	webhookId?: string;
	webhookToken?: string;
}

export async function handleGlobalChatMessage(
	message: Message,
	client: UsingClient,
): Promise<void> {
	if (message.author.bot) return;
	const guild = await message.guild();
	if (!guild) return;

	// Get global chat channel for this guild
	const globalChannelId = await client.database.getGlobalChatChannel(guild.id);
	if (!globalChannelId || message.channelId !== globalChannelId) return;

	// Get all global chat channels from DB (excluding this guild)
	const allGuilds: GlobalChatGuild[] = await client.database.getAllGlobalChat();
	const otherGuilds = allGuilds.filter(
		(g: GlobalChatGuild) => g.globalChannelId && g.id !== guild.id,
	);

	// Prepare content for webhook message
	const content = message.content;
	const username = `${message.author.globalName || message.author.username} • ${guild.name}`;
	const avatarURL = message.author.avatarURL();

	// Collect all image attachments
	let imageEmbeds: Array<{ image: { url: string } }> = [];
	if (message.attachments && message.attachments.length > 0) {
		imageEmbeds = message.attachments
			.filter((a) => a.contentType?.startsWith("image/") && a.url)
			.map((a) => ({ image: { url: a.url } }));
	}

	// Relay message to all other global chat channels using webhooks
	for (const targetGuild of otherGuilds) {
		try {
			if (targetGuild.webhookId && targetGuild.webhookToken) {
				// Send plain text message via webhook, support image if present
				const webhookBody: {
					content: string;
					username: string;
					avatar_url: string;
					embeds?: Array<{ image: { url: string } }>;
				} = {
					content: `${content}\n\n-# From ${guild.name}\n-# Powered by Tronix Development`,
					username: username,
					avatar_url: avatarURL,
				};
				if (imageEmbeds.length > 0) {
					webhookBody.embeds = imageEmbeds;
				}
				await client.webhooks.writeMessage(
					targetGuild.webhookId,
					targetGuild.webhookToken,
					{ body: webhookBody },
				);
			} else {
				// No webhook exists, create one and save to database
				try {
					const webhook = await client.webhooks.create(
						targetGuild.globalChannelId,
						{
							name: message.author.globalName || message.author.username,
							avatar: avatarURL,
						},
					);

					// Update database with new webhook info
					await client.database.createGlobalChatChannel(
						targetGuild.id,
						targetGuild.globalChannelId,
						webhook.id,
						webhook.token,
					);

					// Send plain text message via newly created webhook, support image if present
					const webhookBody: {
						content: string;
						username: string;
						avatar_url: string;
						embeds?: Array<{ image: { url: string } }>;
					} = {
						content: `${content}\n\n-# From ${guild.name}\n-# Powered by Tronix Development`,
						username: username,
						avatar_url: avatarURL,
					};
					if (imageEmbeds.length > 0) {
						webhookBody.embeds = imageEmbeds;
					}
					await client.webhooks.writeMessage(
						webhook.id,
						webhook.token as string,
						{ body: webhookBody },
					);
				} catch (webhookError) {
					console.error(
						`Failed to create webhook for guild ${targetGuild.id}, using fallback:`,
						webhookError,
					);
					// Fallback to bot message with components if webhook creation fails
					const container = new Container().addComponents(
						new Section()
							.setAccessory(
								new Thumbnail()
									.setMedia(avatarURL)
									.setDescription(
										`${message.author.globalName} • ${guild.name}`,
									),
							)
							.addComponents(
								new TextDisplay().setContent(
									`**${message.author.globalName}** from **${guild.name}**:\n\n${content}`,
								),
							),
						new Separator(),
						new TextDisplay().setContent(
							`-# From ${guild.name} • Powered by Tronix Development`,
						),
					);

					await client.messages.write(targetGuild.globalChannelId, {
						components: [container],
						flags: MessageFlags.IsComponentsV2,
					});
				}
			}
		} catch (error) {
			console.error(
				`Failed to send global chat message to guild ${targetGuild.id}:`,
				error,
			);

			// Ultimate fallback: try bot message
			try {
				const container = new Container().addComponents(
					new Section()
						.setAccessory(
							new Thumbnail()
								.setMedia(avatarURL)
								.setDescription(`${message.author.globalName} • ${guild.name}`),
						)
						.addComponents(
							new TextDisplay().setContent(
								`**${message.author.globalName}** from **${guild.name}**:\n\n${content}`,
							),
						),
					new Separator(),
					new TextDisplay().setContent(
						`-# From ${guild.name} • Powered by Tronix Development`,
					),
				);

				await client.messages.write(targetGuild.globalChannelId, {
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			} catch (fallbackError) {
				console.error(
					`Ultimate fallback also failed for guild ${targetGuild.id}:`,
					fallbackError,
				);
			}
		}
	}
}
