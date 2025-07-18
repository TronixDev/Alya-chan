import { createEvent } from "seyfert";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://alya.tronix.my.id",
    "X-Title": "Alya-chan",
  },
});

export default createEvent({
  data: { name: "messageCreate" },
  async run(message, client) {
    // Log semua pesan yang masuk (dari user atau bot)
    console.log(`[LOG] Message received:`, {
      author: message.author?.tag || message.author?.username,
      authorId: message.author?.id,
      isBot: message.author?.bot,
      content: message.content,
      channelId: message.channelId,
      guildId: message.guildId,
    });

    // Hanya respon pesan user, bukan bot
    if (message.author.bot) return;
    // Hanya respon pesan minimal 3 karakter
    if (message.content.length < 3) return;
    // Hanya respon pesan dari channel tertentu
    const allowedChannelId = "1261893751350231121";
    if (allowedChannelId && message.channelId !== allowedChannelId) return;
    // Tampilkan indikator mengetik (jika tersedia) sebelum membalas
    try {
      await client.channels.typing(message.channelId);
    } catch {}

    try {
      // Kirim prompt ke OpenRouter
      const completion = await openai.chat.completions.create({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: message.content }],
          },
        ],
      });
      const reply = completion.choices[0]?.message?.content;
      if (reply) {
        // Log sebelum bot mengirim balasan
        console.log(`[LOG] Bot will respond:`, {
          to: message.author?.tag || message.author?.username,
          channelId: message.channelId,
          guildId: message.guildId,
          content: reply,
        });
        // Efek typing sebelum membalas
        await client.channels.typing(message.channelId);
        await message.reply({ content: reply });
        console.log(`[LOG] Bot responded:`, {
          to: message.author?.tag || message.author?.username,
          channelId: message.channelId,
          guildId: message.guildId,
          content: reply,
        });
      }
    } catch {
      await client.channels.typing(message.channelId);
      await message.reply({ content: "Maaf, chatbot error." });
      console.log(`[LOG] Bot responded with error message to:`, {
        to: message.author?.tag || message.author?.username,
        channelId: message.channelId,
        guildId: message.guildId,
        content: "Maaf, chatbot error.",
      });
    }
  },
});
