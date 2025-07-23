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

interface WebhookBody {
	content: string;
	username: string;
	avatar_url: string;
	embeds?: Array<{
		image?: { url: string };
		description?: string;
	}>;
}

interface ReplyInfo {
	author: string;
	content: string;
}

interface ImageEmbed {
	image: { url: string };
	description?: string;
}

function createWebhookBody(
	processedContent: string,
	username: string,
	avatarURL: string,
	guildName: string,
	globalFooter: string,
	replyInfo: ReplyInfo | null,
	imageEmbeds: ImageEmbed[],
	isEmojiOnly: boolean,
): WebhookBody {
	const webhookBody: WebhookBody = {
		content: processedContent,
		username,
		avatar_url: avatarURL,
	};

	const embeds = [];

	if (replyInfo) {
		embeds.push({
			description: `**Replying to ${replyInfo.author}:**\n> ${replyInfo.content}`,
		});
	}

	if (imageEmbeds.length > 0) {
		embeds.push(...imageEmbeds);
	}

	if (!isEmojiOnly && processedContent.trim()) {
		embeds.push({
			description: `*From **${guildName}** • ${globalFooter.replace("-# ", "")}*`,
			color: 0x2f3136, // Dark theme color
		});
	} else if (isEmojiOnly || imageEmbeds.length > 0) {
		embeds.push({
			description: `*From **${guildName}** • ${globalFooter.replace("-# ", "")}*`,
			color: 0x2f3136,
		});
	}

	if (embeds.length > 0) {
		webhookBody.embeds = embeds;
	}

	return webhookBody;
}

async function sendFallbackMessage(
	client: UsingClient,
	targetChannelId: string,
	authorName: string,
	guildName: string,
	content: string,
	avatarURL: string,
	globalFooter: string,
	replyInfo: ReplyInfo | null,
	imageEmbeds: ImageEmbed[],
	isEmojiOnly: boolean,
): Promise<void> {
	if (isEmojiOnly || imageEmbeds.length > 0) {
		const embeds = [];

		if (replyInfo) {
			embeds.push({
				description: `**Replying to ${replyInfo.author}:**\n> ${replyInfo.content}`,
			});
		}

		embeds.push(...imageEmbeds);

		if (!isEmojiOnly && content.trim()) {
			embeds.push({
				author: {
					name: `${authorName} • ${guildName}`,
					icon_url: avatarURL,
				},
				description: content,
				footer: {
					text: `From **${guildName}** • ${globalFooter.replace("-# ", "")}`,
				},
			});
		}

		await client.messages.write(targetChannelId, { embeds });
		return;
	}

	if (replyInfo) {
		const container = new Container();

		container.addComponents(
			new Section().addComponents(
				new TextDisplay().setContent(
					`**Replying to ${replyInfo.author}:**\n> ${replyInfo.content}`,
				),
			),
		);

		container.addComponents(
			new Section()
				.setAccessory(
					new Thumbnail()
						.setMedia(avatarURL)
						.setDescription(`${authorName} • ${guildName}`),
				)
				.addComponents(
					new TextDisplay().setContent(
						`**${authorName}** from **${guildName}**:\n\n${content}`,
					),
				),
		);

		container.addComponents(
			new Separator(),
			new TextDisplay().setContent(
				`-# From **${guildName}** • ${globalFooter.replace("-# ", "")}`,
			),
		);

		await client.messages.write(targetChannelId, {
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});
		return;
	}

	const container = new Container();

	container.addComponents(
		new Section()
			.setAccessory(
				new Thumbnail()
					.setMedia(avatarURL)
					.setDescription(`${authorName} • ${guildName}`),
			)
			.addComponents(
				new TextDisplay().setContent(
					`**${authorName}** from **${guildName}**:\n\n${content}`,
				),
			),
	);

	container.addComponents(
		new Separator(),
		new TextDisplay().setContent(
			`-# From **${guildName}** • ${globalFooter.replace("-# ", "")}`,
		),
	);

	await client.messages.write(targetChannelId, {
		components: [container],
		flags: MessageFlags.IsComponentsV2,
	});
}

export async function handleGlobalChatMessage_v2(
	message: Message,
	client: UsingClient,
): Promise<void> {
	if (message.author.bot) return;
	const guild = await message.guild();
	if (!guild) return;

	// Kirim data ke API global-chat
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
			referencedMessage: message.referencedMessage ? {
				id: message.referencedMessage.id,
				content: message.referencedMessage.content,
				author: {
					id: message.referencedMessage.author.id,
					username: message.referencedMessage.author.username,
					globalName: message.referencedMessage.author.globalName,
				}
			} : null,
			attachments: message.attachments?.map(a => ({
				url: a.url,
				contentType: a.contentType
			})),
			stickerItems: message.stickerItems?.map(s => ({
				id: s.id,
				name: s.name,
				formatType: s.formatType
			}))
		};

		await fetch("http://localhost:2000/global-chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: safeMessage,
				guildName: guild.name
			})
		});
		console.log("Global chat message sent to API:", safeMessage);
		console.log("Guilds Sender:", guild.name);
	} catch (apiError) {
		console.error("Failed to send global chat to API:", apiError);
	}
}
