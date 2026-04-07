import OpenAI from "openai";
import type { Message, UsingClient } from "seyfert";
import { Environment } from "#alya/config";
import { DEFAULT_LANGUAGE, loadLanguageModel } from "#alya/models";

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

export async function handleChatbotMessage(
	message: Message,
	client: UsingClient,
) {
	if (!client.config.chatbot?.enabled) return;

	if (message.author.bot) return;
	if (message.content.length < 3) return;

	const guild = await message.guild();
	if (!guild) return;

	const isAlyaMentioned = /alya/i.test(message.content);
	const isBotMentioned = message?.mentions?.users?.some(
		(user) => "id" in user && user.id === client.me.id,
	);
	if (!isAlyaMentioned && !isBotMentioned) {
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
		const reply = await handleChatbot(message.content, chatbotLocale);
		if (reply) {
			for (const msg of reply) {
				await client.channels.typing(message.channelId);
				await message.reply({ content: msg });
			}
		}
	} catch (error) {
		console.error("Error handling chatbot message:", error);
		await client.channels.typing(message.channelId);
		await message.reply({ content: "Sorry, im error rn" });
		console.log(`[LOG] Bot responded with error message to:`, {
			to: message.author?.tag || message.author?.username,
			channelId: message.channelId,
			guildId: message.guildId,
			content: "Sorry, im error rn",
		});
	}
}
