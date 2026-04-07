import {
	Command,
	type CommandContext,
	createStringOption,
	Declare,
	type DefaultLocale,
	LocalesT,
	Options,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

const option = {
	locale: createStringOption({
		description: "Enter the new languages",
		required: true,
		locales: {
			name: "cmd.setlocale.options.locale.name",
			description: "cmd.setlocale.options.locale.description",
		},
		autocomplete: async (interaction) => {
			const { client } = interaction;

			await interaction.respond(
				Object.entries<DefaultLocale>(client.langs.values)
					.map(([value, l]) => ({
						name: `${l.metadata.name} [${l.metadata.code}] - ${l.metadata.translators.join(", ")}`,
						value,
					}))
					.slice(0, 25),
			);
		},
	}),
};

@Declare({
	name: "setlocale",
	description: "Change your server languages",
	aliases: ["locale", "lang", "language"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@LocalesT("cmd.setlocale.name", "cmd.setlocale.description")
@AlyaOptions({ cooldown: 10, category: AlyaCategory.Configurations })
@Options(option)
export default class SetLocaleCommand extends Command {
	public override async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		const { locale } = options;

		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		const locales = Object.keys(client.langs.values);
		if (!locales.includes(locale))
			return ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						description: cmd.setlocale.run.invalid({
							locale,
							available: locales.join(", "),
						}),
						color: client.config.color.yes,
					},
				],
			});

		await client.database.setLocale(guildId, locale);
		await ctx.editOrReply({
			flags: MessageFlags.Ephemeral,
			embeds: [
				{
					description: cmd.setlocale.run.success({ locale }),
					color: client.config.color.primary,
				},
			],
		});
	}
}
