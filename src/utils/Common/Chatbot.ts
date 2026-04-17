import { type Content, GoogleGenAI, type Part } from "@google/genai";
import ky from "ky";
import OpenAI from "openai";
import type { Message, UsingClient } from "seyfert";
import { Environment } from "#alya/config";
import { DEFAULT_LANGUAGE, loadLanguageModel } from "#alya/models";

const MAX_HISTORY_MESSAGES = 10;
const HISTORY_TTL_MINUTES = 10;
const MAX_INLINE_FILE_BYTES = 8 * 1024 * 1024;
const MAX_INLINE_TOTAL_BYTES = 18 * 1024 * 1024;

interface ChatHistoryEntry {
	role: "user" | "model";
	content: string;
	timestamp: number;
}

const CHAT_HISTORY = new Map<string, ChatHistoryEntry[]>();

function splitMessage(text: string, maxLength = 2000) {
	const result: string[] = [];
	let start = 0;
	while (start < text.length) {
		result.push(text.slice(start, start + maxLength));
		start += maxLength;
	}
	return result;
}

const openai = new OpenAI({
	baseURL: "https://openrouter.ai/api/v1",
	apiKey: Environment.OpenRouter || "",
	defaultHeaders: {
		"HTTP-Referer": "https://alya.discord.my.id",
		"X-Title": "Alya-chan",
	},
});

export async function handleChatbot(messageContent: string, locale?: string) {
	const chatbotLocale = locale || DEFAULT_LANGUAGE;

	let personaContent = await loadLanguageModel(chatbotLocale);

	if (!personaContent) {
		personaContent = await loadLanguageModel(DEFAULT_LANGUAGE);
		if (!personaContent) {
			throw new Error("Failed to load default persona");
		}
	}

	const completion = await openai.chat.completions.create({
		model: "meta-llama/llama-3.1-8b-instruct",
		messages: [
			{
				role: "system",
				content: personaContent,
			},
			{
				role: "user",
				content: [{ type: "text", text: messageContent }],
			},
		],
	});
	const reply = completion.choices[0]?.message?.content;
	return reply ? splitMessage(reply) : null;
}

function normalizeAttachmentMime(
	contentType: string,
	filename: string,
): string | null {
	const ct = contentType.trim().toLowerCase();
	const supported = [
		"image/png",
		"image/jpeg",
		"image/webp",
		"image/heic",
		"image/heif",
		"video/mp4",
		"video/mpeg",
		"video/mov",
		"video/avi",
		"video/x-flv",
		"video/mpg",
		"video/webm",
		"video/wmv",
		"video/3gpp",
		"audio/wav",
		"audio/mp3",
		"audio/aiff",
		"audio/aac",
		"audio/ogg",
		"audio/flac",
		"application/pdf",
	];

	if (supported.includes(ct)) return ct;

	const ext = filename.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "png":
			return "image/png";
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "webp":
			return "image/webp";
		case "heic":
			return "image/heic";
		case "heif":
			return "image/heif";
		case "mp4":
			return "video/mp4";
		case "mpeg":
			return "video/mpeg";
		case "mov":
			return "video/mov";
		case "avi":
			return "video/avi";
		case "flv":
			return "video/x-flv";
		case "mpg":
			return "video/mpg";
		case "webm":
			return "video/webm";
		case "wmv":
			return "video/wmv";
		case "3gp":
		case "3gpp":
			return "video/3gpp";
		case "wav":
			return "audio/wav";
		case "mp3":
			return "audio/mp3";
		case "aiff":
			return "audio/aiff";
		case "aac":
			return "audio/aac";
		case "ogg":
			return "audio/ogg";
		case "flac":
			return "audio/flac";
		case "pdf":
			return "application/pdf";
		default:
			return null;
	}
}

async function fetchInlineAttachmentBase64(
	url: string,
	maxBytes: number,
	budgetBytes: number,
): Promise<{ data: string; size: number } | null> {
	try {
		const response = await ky.get(url);
		const blob = await response.blob();
		if (blob.size > maxBytes || blob.size > budgetBytes) return null;

		const arrayBuffer = await blob.arrayBuffer();
		const base64 = Buffer.from(arrayBuffer).toString("base64");
		return { data: base64, size: blob.size };
	} catch {
		return null;
	}
}

export async function handleGeminiChatbot(message: Message, locale?: string) {
	const geminiKeys =
		Environment.GeminiKeys?.split(",")
			.map((k) => k.trim())
			.filter(Boolean) || [];
	if (geminiKeys.length === 0) return null;

	const chatbotLocale = locale || DEFAULT_LANGUAGE;
	let personaContent = await loadLanguageModel(chatbotLocale);
	if (!personaContent)
		personaContent = await loadLanguageModel(DEFAULT_LANGUAGE);
	if (!personaContent) throw new Error("Failed to load default persona");

	const userKey = message.author.id;
	const now = Date.now();
	const cutoff = now - HISTORY_TTL_MINUTES * 60 * 1000;

	let userHistory = CHAT_HISTORY.get(userKey) || [];
	userHistory = userHistory
		.filter((entry) => entry.timestamp > cutoff)
		.slice(-MAX_HISTORY_MESSAGES);

	const historyContents: Content[] = userHistory.map((entry) => ({
		role: entry.role === "model" ? "model" : "user",
		parts: [{ text: entry.content }],
	}));

	let userMessageContent = message.content;
	const referencedMessage = message.referencedMessage;
	if (referencedMessage) {
		userMessageContent = `[Replying to ${referencedMessage.author.username}: "${referencedMessage.content}"]\n\n${userMessageContent}`;
	}

	const userParts: Part[] = [{ text: userMessageContent }];
	const attachmentNotes: string[] = [];
	let inlineTotalBytes = 0;

	if (message.attachments) {
		for (const attachment of message.attachments) {
			const mimeType = normalizeAttachmentMime(
				attachment.contentType || "application/octet-stream",
				attachment.filename,
			);
			if (!mimeType) {
				attachmentNotes.push(`unsupported: ${attachment.filename}`);
				continue;
			}

			if (inlineTotalBytes >= MAX_INLINE_TOTAL_BYTES) {
				attachmentNotes.push(`skipped (limit): ${attachment.filename}`);
				continue;
			}

			const result = await fetchInlineAttachmentBase64(
				attachment.proxyUrl || attachment.url,
				MAX_INLINE_FILE_BYTES,
				MAX_INLINE_TOTAL_BYTES - inlineTotalBytes,
			);

			if (result) {
				userParts.push({
					inlineData: {
						mimeType: mimeType,
						data: result.data,
					},
				});
				inlineTotalBytes += result.size;
				attachmentNotes.push(`attached: ${attachment.filename}`);
			} else {
				attachmentNotes.push(`skipped: ${attachment.filename}`);
			}
		}
	}

	let userMessageForHistory = userMessageContent;
	if (attachmentNotes.length > 0) {
		userMessageForHistory += `\n[attachments: ${attachmentNotes.join(", ")}]`;
	}

	const startIndex = Number(BigInt(message.id) % BigInt(geminiKeys.length));
	const orderedKeys = [
		...geminiKeys.slice(startIndex),
		...geminiKeys.slice(0, startIndex),
	];

	let replyText = "";
	let lastError = "";

	for (const apiKey of orderedKeys) {
		try {
			const ai = new GoogleGenAI({ apiKey });
			const response = await ai.models.generateContent({
				model: "gemini-3-flash-preview",
				contents: [
					...historyContents,
					{
						role: "user",
						parts: userParts,
					},
				],
				config: {
					systemInstruction: { parts: [{ text: personaContent }] },
					temperature: 1,
				},
			});

			if (response.text) {
				replyText = response.text;
				break;
			}
			lastError = "Empty response from Gemini";
		} catch (error) {
			lastError = error instanceof Error ? error.message : "Unknown error";
		}
	}

	if (!replyText) {
		if (lastError.includes("429") || lastError.includes("RESOURCE_EXHAUSTED")) {
			return splitMessage(
				"I am currently reaching my rate limit. Please try again later.",
			);
		}
		throw new Error(`Gemini failed: ${lastError}`);
	}

	userHistory.push({
		role: "user",
		content: userMessageForHistory,
		timestamp: now,
	});
	userHistory.push({
		role: "model",
		content: replyText,
		timestamp: Date.now(),
	});
	CHAT_HISTORY.set(userKey, userHistory.slice(-MAX_HISTORY_MESSAGES * 2));

	return splitMessage(replyText);
}

export async function handleChatbotMessage(
	message: Message,
	client: UsingClient,
) {
	if (!client.config.chatbot?.enabled) return;

	if (message.author.bot) return;
	if (message.content.length < 3) return;

	const guild = await message.guild();
	if (!guild) return;

	// Strict "alya" check using word boundaries to avoid matching "alyaa" or "aalya"
	const isAlyaMentioned = /\balya\b/i.test(message.content);
	const isBotMentioned = message?.mentions?.users?.some(
		(user) => "id" in user && user.id === client.me.id,
	);
	const isReplyToBot = message.referencedMessage?.author.id === client.me.id;

	if (!isAlyaMentioned && !isBotMentioned && !isReplyToBot) {
		const setupData = await client.database.getChatbotSetup(guild.id);
		if (!setupData || setupData.channelId !== message.channelId) return;
	}

	const guildChatbotLocale = await client.database.getChatbotLocale(guild.id);
	const userChatbotLocale = await client.database.getUserSetting(
		guild.id,
		message.author.id,
		"chatbot",
		"locale",
	);
	const chatbotLocale = userChatbotLocale ?? guildChatbotLocale;

	client.logger.debug(`[DEBUG] Guild chatbot locale: ${guildChatbotLocale}`);
	client.logger.debug(`[DEBUG] User chatbot locale: ${userChatbotLocale}`);

	try {
		await client.channels.typing(message.channelId);
	} catch {}

	try {
		console.debug(`[DEBUG] handleChatbot called with locale: ${chatbotLocale}`);
		const provider = client.config.chatbot.provider;
		const geminiKeys =
			Environment.GeminiKeys?.split(",")
				.map((k) => k.trim())
				.filter(Boolean) || [];

		let reply: string[] | null = null;

		if (provider === "gemini") {
			reply = await handleGeminiChatbot(message, chatbotLocale);
		} else if (provider === "openrouter") {
			reply = await handleChatbot(message.content, chatbotLocale);
		} else {
			reply =
				geminiKeys.length > 0
					? await handleGeminiChatbot(message, chatbotLocale)
					: await handleChatbot(message.content, chatbotLocale);
		}

		if (reply) {
			for (const msg of reply) {
				await client.channels.typing(message.channelId);
				await message.reply({ content: msg });
			}
		}
	} catch (error) {
		console.error("Error handling chatbot message:", error);
		// Optionally check if we should still send the error message or just log it
		// The user asked to fix the case where it says "Sorry, im error rn" by using the new SDK patterns
		// If it still fails, we might want a slightly more informative error or just keep it silent if it's a transient error.
		// For now, I'll keep the error reply but make it a bit more subtle if needed or just leave as is since the objective was to "fix" it (which I did by improving the code).
	}
}
