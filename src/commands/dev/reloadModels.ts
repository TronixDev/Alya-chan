import {
	Command,
	type CommandContext,
	Declare,
	Options,
	createStringOption,
} from "seyfert";
import { AlyaOptions } from "#alya/utils";
import { MessageFlags } from "seyfert/lib/types";
import {
	reloadLanguageModel,
	preloadAllModels,
	clearModelCache,
	getAvailableLanguageCodes,
	getCacheStats,
} from "#alya/models";

const option = {
	action: createStringOption({
		description: "Action to perform",
		required: true,
		choices: [
			{ name: "Reload All Models", value: "reload_all" },
			{ name: "Clear Cache", value: "clear_cache" },
			{ name: "Reload Specific Language", value: "reload_lang" },
		],
	}),
	language: createStringOption({
		description: "Language code to reload (only for reload_lang action)",
		required: false,
		choices: getAvailableLanguageCodes().map((code) => ({
			name: code.toUpperCase(),
			value: code,
		})),
	}),
};

@Declare({
	name: "reloadmodels",
	description: "Reload language models (Developer only)",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["Administrator"],
})
@AlyaOptions({ onlyDeveloper: true })
@Options(option)
export default class ReloadModelsCommand extends Command {
	public override async run(ctx: CommandContext<typeof option>) {
		const { client, options } = ctx;
		const { action, language } = options;

		await ctx.deferReply();

		try {
			switch (action) {
				case "reload_all": {
					const statsBefore = getCacheStats();
					clearModelCache();
					await preloadAllModels();
					const statsAfter = getCacheStats();

					await ctx.editOrReply({
						flags: MessageFlags.Ephemeral,
						embeds: [
							{
								title: "🔄 Models Reloaded",
								description: [
									"Successfully reloaded all language models!",
									"",
									`**Before:** ${statsBefore.size} models cached`,
									`**After:** ${statsAfter.size} models cached`,
									"",
									"All models are now fresh from disk.",
								].join("\n"),
								color: client.config.color.yes,
								timestamp: new Date().toISOString(),
							},
						],
					});
					break;
				}

				case "clear_cache": {
					const statsBefore = getCacheStats();
					clearModelCache();
					const statsAfter = getCacheStats();

					await ctx.editOrReply({
						flags: MessageFlags.Ephemeral,
						embeds: [
							{
								title: "🧹 Cache Cleared",
								description: [
									"Successfully cleared language model cache!",
									"",
									`**Before:** ${statsBefore.size} models cached`,
									`**After:** ${statsAfter.size} models cached`,
									"",
									"Models will be loaded from disk on next use.",
								].join("\n"),
								color: client.config.color.warn,
								timestamp: new Date().toISOString(),
							},
						],
					});
					break;
				}

				case "reload_lang": {
					if (!language) {
						await ctx.editOrReply({
							flags: MessageFlags.Ephemeral,
							embeds: [
								{
									description: "❌ Please specify a language code to reload.",
									color: client.config.color.no,
								},
							],
						});
						return;
					}

					const content = await reloadLanguageModel(language);
					if (content) {
						await ctx.editOrReply({
							flags: MessageFlags.Ephemeral,
							embeds: [
								{
									title: "🔄 Language Model Reloaded",
									description: [
										`Successfully reloaded **${language.toUpperCase()}** language model!`,
										"",
										`**Content length:** ${content.length} characters`,
										"",
										"The model is now fresh from disk.",
									].join("\n"),
									color: client.config.color.yes,
									timestamp: new Date().toISOString(),
								},
							],
						});
					} else {
						await ctx.editOrReply({
							flags: MessageFlags.Ephemeral,
							embeds: [
								{
									description: `❌ Failed to reload language model for: **${language.toUpperCase()}**`,
									color: client.config.color.no,
								},
							],
						});
					}
					break;
				}

				default:
					await ctx.editOrReply({
						flags: MessageFlags.Ephemeral,
						embeds: [
							{
								description: "❌ Invalid action specified.",
								color: client.config.color.no,
							},
						],
					});
			}
		} catch (error) {
			console.error("Error reloading models:", error);
			await ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						description:
							"❌ An error occurred while reloading models. Please check the logs.",
						color: client.config.color.no,
					},
				],
			});
		}
	}
}
