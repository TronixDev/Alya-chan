import { type CommandContext, Declare, LocalesT, SubCommand } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import {
	getCacheStats,
	getLanguageInfo,
	validateModelFiles,
} from "#alya/models";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "status",
	description: "Show chatbot language and status information",
	aliases: ["alyastatus", "chatbotinfo"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Configurations })
@LocalesT("cmd.chatbot.status.name", "cmd.chatbot.status.description")
export default class ChatbotStatusCommand extends SubCommand {
	public override async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		const { cmd } = await ctx.getLocale();

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

			// Validate model files using shared models module
			const validation = await validateModelFiles();

			// Check if chatbot is enabled globally
			const chatbotEnabled = client.config.chatbot?.enabled ?? false;

			await ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						title: `${client.config.emoji.info} ${cmd.chatbot.status.title({ bot: client.me.username })}`,
						fields: [
							{
								name: `${client.config.emoji.globe} ${cmd.chatbot.status.fields.current_language.title}`,
								value: langInfo
									? `${langInfo.flag} **${langInfo.name}** (\`${langInfo.code}\`)\n${
											currentLocale === "auto"
												? `${client.config.emoji.globe} ${cmd.chatbot.status.fields.current_language.auto_note}`
												: ""
										}`
									: `${client.config.emoji.no} ${cmd.chatbot.status.fields.current_language.unknown({ code: currentLocale })}`,
								inline: true,
							},
							{
								name: `${client.config.emoji.info} ${cmd.chatbot.status.fields.global_status.title}`,
								value: chatbotEnabled
									? `${client.config.emoji.yes} ${cmd.chatbot.status.fields.global_status.enabled}`
									: `${client.config.emoji.no} ${cmd.chatbot.status.fields.global_status.disabled}`,
								inline: true,
							},
							{
								name: `${client.config.emoji.folder} ${cmd.chatbot.status.fields.channel_setup.title}`,
								value: setupData
									? cmd.chatbot.status.fields.channel_setup.configured({
											channelId: setupData.channelId,
										})
									: `${client.config.emoji.no} ${cmd.chatbot.status.fields.channel_setup.not_configured}`,
								inline: true,
							},
							{
								name: `${client.config.emoji.list} ${cmd.chatbot.status.fields.model_cache.title}`,
								value: [
									cmd.chatbot.status.fields.model_cache.loaded({
										count: cacheStats.size,
									}),
									cmd.chatbot.status.fields.model_cache.languages({
										list: cacheStats.languages.join(", ") || "None",
									}),
								].join("\n"),
								inline: true,
							},
							{
								name: `${client.config.emoji.folder} ${cmd.chatbot.status.fields.model_files.title}`,
								value: validation.valid
									? `${client.config.emoji.yes} ${cmd.chatbot.status.fields.model_files.valid}`
									: `${client.config.emoji.no} ${cmd.chatbot.status.fields.model_files.missing({ list: validation.missing.map((m) => `• ${m}`).join("\n") })}`,
								inline: true,
							},
							{
								name: `${client.config.emoji.pencil} ${cmd.chatbot.status.fields.how_to_change_language.title}`,
								value:
									cmd.chatbot.status.fields.how_to_change_language.description,
								inline: false,
							},
						],
						color: client.config.color.primary,
						footer: {
							text: cmd.chatbot.status.footer,
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
						description: cmd.chatbot.status.error,
						color: client.config.color.no,
					},
				],
			});
		}
	}
}
