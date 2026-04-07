import {
	type CommandContext,
	createStringOption,
	createUserOption,
	Declare,
	LocalesT,
	Options,
	SubCommand,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

const option = {
	target: createStringOption({
		description: "Set locale for server or user",
		required: true,
		choices: [
			{ name: "server", value: "server" },
			{ name: "user", value: "user" },
		],
		locales: {
			name: "cmd.chatbot.sub.locale.options.target.name",
			description: "cmd.chatbot.sub.locale.options.target.description",
		},
	}),
	locale: createStringOption({
		description: "Locale code (e.g., en, id)",
		required: true,
		locales: {
			name: "cmd.chatbot.sub.locale.options.locale.name",
			description: "cmd.chatbot.sub.locale.options.locale.description",
		},
		autocomplete: async (interaction) => {
			const { client } = interaction;
			await interaction.respond(
				Object.entries(client.langs.values)
					.slice(0, 25)
					.map(([value, l]) => ({
						name: `${l.metadata.name} [${l.metadata.code}]`,
						value,
					})),
			);
		},
	}),
	user: createUserOption({
		description:
			"Select a user for personal locale (only server target optional)",
		required: false,
	}),
};

@Declare({
	name: "locale",
	description: "Manage chatbot locale",
})
@AlyaOptions({ cooldown: 10, category: AlyaCategory.Configurations })
@Options(option)
@LocalesT("cmd.chatbot.sub.locale.name", "cmd.chatbot.sub.locale.description")
export default class ChatbotLocaleCommand extends SubCommand {
	public override async run(ctx: CommandContext<typeof option>) {
		const { client, guildId, options, author } = ctx;
		const { cmd } = await ctx.getLocale();
		if (!guildId) return;

		const { target, locale, user } = options;

		if (target === "server") {
			await client.database.setChatbotLocale(guildId, locale);
			await ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						color: client.config.color.yes,
						description: `${client.config.emoji.yes} ${cmd.chatbot.sub.locale.run.server_success({ locale })}`,
					},
				],
			});
			return;
		}

		const userId = user?.id ?? author.id;
		await client.database.setUserSetting(
			guildId,
			userId,
			"chatbot",
			"locale",
			locale,
		);
		await ctx.editOrReply({
			flags: MessageFlags.Ephemeral,
			embeds: [
				{
					color: client.config.color.yes,
					description: `${client.config.emoji.yes} ${cmd.chatbot.sub.locale.run.user_success({ user: `<@${userId}>`, locale })}`,
				},
			],
		});
	}
}
