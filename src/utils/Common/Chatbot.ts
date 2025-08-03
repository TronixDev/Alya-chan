import type { UsingClient, Message } from "seyfert";
import OpenAI from "openai";
import { loadLanguageModel, DEFAULT_LANGUAGE } from "#alya/models";

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
	apiKey: Bun.env.OPENROUTER_API_KEY,
	defaultHeaders: {
		"HTTP-Referer": "https://alya.tronix.my.id",
		"X-Title": "Alya-chan",
	},
});

export async function handleChatbot(
	messageContent: string,
	locale: string = DEFAULT_LANGUAGE,
) {
	// Load persona content based on locale
	const personaContent = await loadLanguageModel(locale);

	if (!personaContent) {
		console.error(`Failed to load persona for locale: ${locale}`);
		// Fallback to default language
		const fallbackContent = await loadLanguageModel(DEFAULT_LANGUAGE);
		if (!fallbackContent) {
			throw new Error("Failed to load any persona content");
		}
		// Use fallback content
		const completion = await openai.chat.completions.create({
			model: "meta-llama/llama-3.1-8b-instruct",
			messages: [
				{
					role: "system",
					content: fallbackContent,
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

export async function handleChatbotMessage(
	message: Message,
	client: UsingClient,
) {
	if (!client.config.chatbot?.enabled) return;

	if (message.author.bot) return;
	if (message.content.length < 3) return;

	const guild = await message.guild();
	if (!guild) return;

	// Ambil channelId yang di-set dari database
	// Bypass setupData jika pesan mengandung 'alya' (case-insensitive) atau mention bot
	const isAlyaMentioned = /alya/i.test(message.content);
	const isBotMentioned = message?.mentions?.users?.some(
		(user) => "id" in user && user.id === client.me.id,
	);
	if (!isAlyaMentioned && !isBotMentioned) {
		const setupData = await client.database.getChatbotSetup(guild.id);
		if (!setupData || setupData.channelId !== message.channelId) return;
	}

	try {
		await client.channels.typing(message.channelId);
	} catch {}

	try {
		// Get chatbot locale for this guild
		const chatbotLocale = await client.database.getChatbotLocale(guild.id);
		const reply = await handleChatbot(message.content, chatbotLocale);
		if (reply) {
			// console.log(`[LOG] Bot will respond:`, {
			// 	to: message.author?.tag || message.author?.username,
			// 	channelId: message.channelId,
			// 	guildId: message.guildId,
			// 	content: reply.join("\n"),
			// });
			for (const msg of reply) {
				await client.channels.typing(message.channelId);
				await message.reply({ content: msg });
			}
			// console.log(`[LOG] Bot responded:`, {
			// 	to: message.author?.tag || message.author?.username,
			// 	channelId: message.channelId,
			// 	guildId: message.guildId,
			// 	content: reply.join("\n"),
			// });
		}
	} catch (error) {
		console.error("Error handling chatbot message:", error);
		await client.channels.typing(message.channelId);

		// Get chatbot locale for error message
		const chatbotLocale = await client.database.getChatbotLocale(guild.id);
		const errorMessage =
			chatbotLocale === "en" ? "Sorry, chatbot error." : "Maaf, chatbot error.";

		await message.reply({ content: errorMessage });
		console.log(`[LOG] Bot responded with error message to:`, {
			to: message.author?.tag || message.author?.username,
			channelId: message.channelId,
			guildId: message.guildId,
			content: errorMessage,
		});
	}
}
