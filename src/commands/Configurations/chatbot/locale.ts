import {
	type CommandContext,
	createStringOption,
	Declare,
	LocalesT,
	Options,
	SubCommand,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import {
	AVAILABLE_LANGUAGES,
	getLanguageInfo,
	isValidLanguage,
} from "#alya/models";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

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
@LocalesT("cmd.chatbot.locale.name", "cmd.chatbot.locale.description")
export default class SetChatbotLocaleCommand extends SubCommand {
	public override async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		const { cmd } = await ctx.getLocale();
		const { locale } = options;

		if (!guildId) return;

		const langInfo = getLanguageInfo(locale);
		if (!langInfo || !isValidLanguage(locale))
			return ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						description: `${client.config.emoji.no} ${cmd.chatbot.locale.errors.invalid({ locale })}`,
						color: client.config.color.no,
					},
				],
			});

		await client.database.setChatbotLocale(guildId, locale);

		await ctx.editOrReply({
			flags: MessageFlags.Ephemeral,
			embeds: [
				{
					description: `${client.config.emoji.yes} ${cmd.chatbot.locale.responses.success_prefix({ flag: langInfo.flag, name: langInfo.name, code: locale })}\n\n${
						locale === "id"
							? cmd.chatbot.locale.responses.suffix.id
							: locale === "en"
								? cmd.chatbot.locale.responses.suffix.en
								: locale === "auto"
									? cmd.chatbot.locale.responses.suffix.auto
									: cmd.chatbot.locale.responses.suffix.generic({
											name: langInfo.name,
										})
					}`,
					color: client.config.color.primary,
				},
			],
		});
	}
}
