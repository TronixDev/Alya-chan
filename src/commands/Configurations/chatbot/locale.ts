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
	getAvailableLanguages,
	isValidLanguage,
	getLanguageInfo,
} from "#alya/models";

const availableLanguages = getAvailableLanguages();

const option = {
	locale: createStringOption({
		description: "Choose chatbot language",
		required: true,
		choices: availableLanguages.map((lang) => ({
			name: lang.name,
			value: lang.value,
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
					description: `${client.config.emoji.yes} Successfully set chatbot language to: **${langInfo.flag} ${langInfo.name}**\n\n${
						locale === "id"
							? "Alya sekarang akan merespons dalam bahasa Indonesia!"
							: "Alya will now respond in English!"
					}`,
					color: client.config.color.primary,
				},
			],
		});
	}
}
