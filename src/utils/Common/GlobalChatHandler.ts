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

export async function handleGlobalChatMessage(
	message: Message,
	client: UsingClient,
): Promise<void> {
	if (message.author.bot) return;
	const guild = await message.guild();
	if (!guild) return;

	const globalChannelId = await client.database.getGlobalChatChannel(guild.id);
	if (!globalChannelId || message.channelId !== globalChannelId) return;

	// Get all global chat channels from DB (excluding this guild)
	const allGuilds: GlobalChatGuild[] = await client.database.getAllGlobalChat();
	const otherGuilds = allGuilds.filter(
		(g: GlobalChatGuild) => g.globalChannelId && g.id !== guild.id,
	);

	// console.log(message)

	const content = message.content;
	const username = message.author.globalName || message.author.username;
	const avatarURL = message.author.avatarURL();
	const globalFooter = "-# Powered by Tronix Development";

	let replyInfo: ReplyInfo | null = null;
	if (message.referencedMessage) {
		const originalAuthor =
			message.referencedMessage.author.globalName ||
			message.referencedMessage.author.username;

		replyInfo = {
			author: originalAuthor,
			content:
				message.referencedMessage.content.length > 100
					? `${message.referencedMessage.content.substring(0, 100)}...`
					: message.referencedMessage.content || "[Media/Attachment]",
		};
	}

	let imageEmbeds: ImageEmbed[] = [];
	if (message.attachments?.length > 0) {
		imageEmbeds = message.attachments
			.filter((a) => a.contentType?.startsWith("image/") && a.url)
			.map((a) => ({ image: { url: a.url } }));
	}

	if (message.stickerItems && message.stickerItems.length > 0) {
		const stickerEmbeds = message.stickerItems.map((s) => ({
			image: {
				url: `https://media.discordapp.net/stickers/${s.id}.${s.formatType === 1 ? "png" : s.formatType === 2 ? "png" : "gif"}`,
			},
			description: `Sticker: ${s.name}`,
		}));
		imageEmbeds.push(...stickerEmbeds);
	}

	let processedContent = content.replace(/<a?:([^:]+):(\d+)>/g, ":$1:");

	const hasContent =
		content.trim() ||
		message.attachments?.length > 0 ||
		(message.stickerItems && message.stickerItems.length > 0) ||
		replyInfo;

	if (!hasContent) return;

	let isEmojiOnly = false;
	const hasMediaContent =
		message.attachments?.length || message.stickerItems?.length;

	if (content.trim() && !hasMediaContent) {
		const emojiMatch = content.match(/^<a?:([^:]+):(\d+)>$/);
		if (emojiMatch) {
			const emojiId = emojiMatch[2];
			const isAnimated = content.startsWith("<a:");
			const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? "gif" : "webp"}`;
			imageEmbeds.push({
				image: { url: emojiUrl },
				description: `Emoji: :${emojiMatch[1]}:`,
			});
			processedContent = "";
			isEmojiOnly = true;
		}
	}

	const authorName = message.author.globalName || message.author.username;

	for (const targetGuild of otherGuilds) {
		const hasWebhook = targetGuild.webhookId && targetGuild.webhookToken;

		try {
			let webhookId = targetGuild.webhookId;
			let webhookToken = targetGuild.webhookToken;

			if (!hasWebhook) {
				try {
					const webhook = await client.webhooks.create(
						targetGuild.globalChannelId,
						{
							name: authorName,
							avatar: avatarURL,
						},
					);

					webhookId = webhook.id;
					webhookToken = webhook.token;

					await client.database.createGlobalChatChannel(
						targetGuild.id,
						targetGuild.globalChannelId,
						webhook.id,
						webhook.token,
					);
				} catch (webhookError) {
					console.error(
						`Failed to create webhook for guild ${targetGuild.id}, using fallback:`,
						webhookError,
					);

					await sendFallbackMessage(
						client,
						targetGuild.globalChannelId,
						authorName,
						guild.name,
						content,
						avatarURL,
						globalFooter,
						replyInfo,
						imageEmbeds,
						isEmojiOnly,
					);
					continue;
				}
			}

			if (webhookId && webhookToken) {
				const webhookBody = createWebhookBody(
					processedContent,
					username,
					avatarURL,
					guild.name,
					globalFooter,
					replyInfo,
					imageEmbeds,
					isEmojiOnly,
				);

				await client.webhooks.writeMessage(webhookId, webhookToken, {
					body: webhookBody,
				});
			}
		} catch (error) {
			console.error(
				`Failed to send global chat message to guild ${targetGuild.id}:`,
				error,
			);

			try {
				await sendFallbackMessage(
					client,
					targetGuild.globalChannelId,
					authorName,
					guild.name,
					content,
					avatarURL,
					globalFooter,
					replyInfo,
					imageEmbeds,
					isEmojiOnly,
				);
			} catch (fallbackError) {
				console.error(
					`Ultimate fallback also failed for guild ${targetGuild.id}:`,
					fallbackError,
				);
			}
		}
	}
}
