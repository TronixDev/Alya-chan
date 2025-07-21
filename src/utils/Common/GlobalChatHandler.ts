import { Container, TextDisplay, Separator, Section, Thumbnail } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import type { UsingClient, Message } from "seyfert";

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
	if (message.author.bot || message.content.length < 1) return;
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

	// Create Components V2 container for webhook
	const container = new Container().addComponents(
		new Section()
			.setAccessory(
				new Thumbnail()
					.setMedia(avatarURL)
					.setDescription(`${message.author.globalName || message.author.username} • ${guild.name}`),
			)
			.addComponents(
				new TextDisplay().setContent(
					`**${message.author.globalName || message.author.username}** from **${guild.name}**:\n\n${content}`,
				),
			),
		new Separator(),
		new TextDisplay().setContent(
			`-# From ${guild.name} • Powered by Tronix Development`,
		),
	);

	// Relay message to all other global chat channels using webhooks
	for (const targetGuild of otherGuilds) {
		try {
			if (targetGuild.webhookId && targetGuild.webhookToken) {
				// Try sending Components V2 via webhook
				await client.webhooks.writeMessage(
					targetGuild.webhookId,
					targetGuild.webhookToken,
					{
						body: {
							username: username,
							avatar_url: avatarURL,
							components: [container],
							flags: MessageFlags.IsComponentsV2,
						},
					},
				);
			} else {
				// No webhook exists, create one and save to database
				try {
					const webhook = await client.webhooks.create(
						targetGuild.globalChannelId,
						{
							name: "Alya Global Chat",
							avatar: client.me.avatarURL(),
						},
					);

					// Update database with new webhook info
					await client.database.createGlobalChatChannel(
						targetGuild.id,
						targetGuild.globalChannelId,
						webhook.id,
						webhook.token,
					);

					// Send message using the new webhook with Components V2
					await client.webhooks.writeMessage(
						webhook.id,
						webhook.token as string,
						{
							body: {
								username: username,
								avatar_url: avatarURL,
								components: [container],
								flags: MessageFlags.IsComponentsV2,
							},
						},
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
