import {
	SubCommand,
	type CommandContext,
	Declare,
	Options,
	createStringOption,
} from "seyfert";
import { AlyaOptions } from "#alya/utils";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import {
	isValidLanguage,
	getLanguageInfo,
	AVAILABLE_LANGUAGES,
} from "#alya/models";

const option = {
	locale: createStringOption({
		description: "Choose chatbot language (use language code)",
		required: true,
		choices: AVAILABLE_LANGUAGES.map((lang) => ({
			name: `${lang.flag} ${lang.name} (${lang.code})`,
			value: lang.code,
		})),
	}),
};

@Declare({
	name: "locale",
	description: "Change chatbot language for this server",
	aliases: ["chatbotlang", "setalyalang", "alyalang"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@AlyaOptions({ cooldown: 10, category: AlyaCategory.Configurations })
@Options(option)
export default class SetChatbotLocaleCommand extends SubCommand {
	public override async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		const { locale } = options;

		if (!guildId) return;

		const langInfo = getLanguageInfo(locale);
		if (!langInfo || !isValidLanguage(locale))
			return ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						description: `${client.config.emoji.no} Invalid chatbot locale: ${locale}. Please select from available options.`,
						color: client.config.color.no,
					},
				],
			});

		// Set chatbot locale to database
		await client.database.setChatbotLocale(guildId, locale);

		await ctx.editOrReply({
			flags: MessageFlags.Ephemeral,
			embeds: [
				{
					description: `${client.config.emoji.yes} Successfully set chatbot language to: **${langInfo.flag} ${langInfo.name}** (${locale})\n\n${
						locale === "id"
							? "Alya sekarang akan merespons dalam bahasa Indonesia!"
							: locale === "en"
								? "Alya will now respond in English!"
								: locale === "auto"
									? "Alya will now automatically detect and respond in the same language you use! 🌐"
									: `Alya will now use ${langInfo.name} language model!`
					}`,
					color: client.config.color.primary,
				},
			],
		});
	}
}
