import { SubCommand, type CommandContext, Declare } from "seyfert";
import { AlyaOptions } from "#alya/utils";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import {
	getLanguageInfo,
	getCacheStats,
	validateModelFiles,
} from "#alya/models";

@Declare({
	name: "status",
	description: "Show chatbot language and status information",
	aliases: ["alyastatus", "chatbotinfo"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Configurations })
export default class ChatbotStatusCommand extends SubCommand {
	public override async run(ctx: CommandContext) {
		const { client, guildId } = ctx;

		if (!guildId) return;

		await ctx.deferReply();

		try {
			// Get current chatbot locale for this guild
			const currentLocale = await client.database.getChatbotLocale(guildId);
			const langInfo = getLanguageInfo(currentLocale);

			// Get chatbot setup info
			const setupData = await client.database.getChatbotSetup(guildId);

			// Get cache statistics
			const cacheStats = getCacheStats();

			// Validate model files
			const validation = await validateModelFiles();

			// Check if chatbot is enabled globally
			const chatbotEnabled = client.config.chatbot?.enabled ?? false;

			await ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						title: `🤖 Chatbot Status - ${client.me.username}`,
						fields: [
							{
								name: "🌐 Current Language",
								value: langInfo
									? `${langInfo.flag} **${langInfo.name}** (\`${langInfo.code}\`)`
									: `❌ Unknown language code: \`${currentLocale}\``,
								inline: true,
							},
							{
								name: "⚙️ Global Status",
								value: chatbotEnabled ? "🟢 Enabled" : "🔴 Disabled",
								inline: true,
							},
							{
								name: "📍 Channel Setup",
								value: setupData
									? `<#${setupData.channelId}>`
									: "❌ Not configured\n*Responds to mentions only*",
								inline: true,
							},
							{
								name: "📊 Model Cache",
								value: [
									`**Loaded:** ${cacheStats.size} models`,
									`**Languages:** ${cacheStats.languages.join(", ") || "None"}`,
								].join("\n"),
								inline: true,
							},
							{
								name: "🔍 Model Files",
								value: validation.valid
									? "✅ All model files found"
									: `❌ Missing files:\n${validation.missing.map((m) => `• ${m}`).join("\n")}`,
								inline: true,
							},
							{
								name: "📝 How to Change Language",
								value:
									"Use `/setchatbotlocale` to change the chatbot language for this server.",
								inline: false,
							},
						],
						color: client.config.color.primary,
						footer: {
							text: "Language models are cached for better performance",
						},
						timestamp: new Date().toISOString(),
					},
				],
			});
		} catch (error) {
			console.error("Error getting chatbot status:", error);
			await ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						description:
							"❌ Failed to get chatbot status. Please try again later.",
						color: client.config.color.no,
					},
				],
			});
		}
	}
}
