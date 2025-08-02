import type { UsingClient, Message } from "seyfert";
import OpenAI from "openai";
import fs from "node:fs/promises";
import path from "node:path";

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
	baseURL: "https://router.huggingface.co/v1",
	apiKey: "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",
});

export async function handleChatbot(messageContent: string) {
	// Baca persona Alya dari TXT
	const personaPath = path.resolve(process.cwd(), "models/alya-id.txt");
	const personaRaw = await fs.readFile(personaPath, "utf8");
	const completion = await openai.chat.completions.create({
		model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct:fireworks-ai",
		messages: [
			{
				role: "system",
				content: personaRaw,
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
		const reply = await handleChatbot(message.content);
		if (reply) {
			console.log(`[LOG] Bot will respond:`, {
				to: message.author?.tag || message.author?.username,
				channelId: message.channelId,
				guildId: message.guildId,
				content: reply.join("\n"),
			});
			for (const msg of reply) {
				await client.channels.typing(message.channelId);
				await message.reply({ content: msg });
			}
			console.log(`[LOG] Bot responded:`, {
				to: message.author?.tag || message.author?.username,
				channelId: message.channelId,
				guildId: message.guildId,
				content: reply.join("\n"),
			});
		}
	} catch (error) {
		console.error("Error handling chatbot message:", error);
		await client.channels.typing(message.channelId);
		await message.reply({ content: "Maaf, chatbot error." });
		console.log(`[LOG] Bot responded with error message to:`, {
			to: message.author?.tag || message.author?.username,
			channelId: message.channelId,
			guildId: message.guildId,
			content: "Maaf, chatbot error.",
		});
	}
}
