import {
	ActionRow,
	Command,
	type CommandContext,
	ContextMenuCommand,
	Declare,
	Embed,
	LocalesT,
	Options,
	StringSelectOption,
	SubCommand,
	createStringOption,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaOptions, EmbedPaginator, AlyaStringMenu } from "#alya/utils";
import { AlyaCategory } from "#alya/types";

const option = {
	command: createStringOption({
		description: "The command to get help for",
		required: false,
		locales: {
			name: "cmd.help.options.command.name",
			description: "cmd.help.options.command.description",
		},
	}),
};

@Declare({
	name: "help",
	description: "Get information on our bot commands and features",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.help.name", "cmd.help.description")
@Options(option)
@AlyaOptions({ category: AlyaCategory.Informations, cooldown: 5 })
export default class HelpCommand extends Command {
	async run(ctx: CommandContext<typeof option>) {
		const { client, options } = ctx;

		const { cmd } = await ctx.getLocale();

		const categoryList = client.commands.values
			.filter((command) => !command.guildId)
			.map((command) => Number(command.category))
			.filter(
				(item, index, commands) =>
					commands.indexOf(item) === index && item !== AlyaCategory.Developers,
			);

		const getCategoryName = (category: number) => {
			return AlyaCategory[category as AlyaCategory] ?? cmd.help.run.unknown;
		};

		const getCategoryEmoji = (category: number): string => {
			switch (category) {
				case AlyaCategory.Configurations:
					return client.config.emoji.pencil;
				case AlyaCategory.Informations:
					return client.config.emoji.info;
				case AlyaCategory.Music:
					return client.config.emoji.music;
				case AlyaCategory.Filters:
					return client.config.emoji.list;
				case AlyaCategory.Playlists:
					return client.config.emoji.folder;
				case AlyaCategory.Reports:
					return client.config.emoji.warn;
				default:
					return client.config.emoji.question;
			}
		};

		if (!options.command) {
			const paginator = new EmbedPaginator(ctx).setDisabled(true);
			const row = new ActionRow<AlyaStringMenu>().addComponents(
				new AlyaStringMenu()
					.setPlaceholder(cmd.help.run.select)
					.setCustomId("guild-helpMenu")
					.setOptions(
						categoryList.map((category) =>
							new StringSelectOption()
								.setLabel(getCategoryName(category))
								.setValue(category.toString())
								.setEmoji(getCategoryEmoji(category)),
						),
					)
					.setRun((interaction, setPage) => {
						const category = Number(interaction.values[0]);
						const commands = client.commands.values.filter(
							(command) => command.category === Number(category),
						);

						paginator.setEmbeds([]).setDisabled(false);

						for (let i = 0; i < commands.length; i += 5) {
							const commandList = commands.slice(i, i + 5);

							paginator.addEmbed(
								new Embed()
									.setColor(client.config.color.primary)
									.setTitle(
										cmd.help.run.categoryTitle({
											category: getCategoryName(category),
										}),
									)
									.setDescription(
										commandList
											.map((command) => parseCommand(command))
											.join("\n"),
									),
							);
						}

						return setPage(0);
					}),
			);

			await paginator
				.setRows([row])
				.addEmbed(
					new Embed()
						.setColor(client.config.color.primary)
						.setTitle(cmd.help.run.title)
						.setDescription(
							[
								cmd.help.run.description[1]({
									user: `<@${ctx.author.id}>`,
									bot: `<@${client.me.id}>`,
								}),
								"",
								cmd.help.run.description[2]({ bot: client.me.username }),
								"",
								categoryList
									.map(
										(category) =>
											`${getCategoryEmoji(category)} : **${getCategoryName(category)}**`,
									)
									.join("\n"),
								"",
								cmd.help.run.description[3],
								"",
								cmd.help.run.description[4]({
									invite: client.config.info.inviteLink,
									support: client.config.info.supportServer,
									vote: client.config.info.voteLink,
								}),
							].join("\n"),
						)
						.setImage(client.config.info.banner)
						.setFooter({
							text: cmd.help.run.footer({ bot: client.me.username }),
						})
						.setTimestamp(),
				)
				.reply();

			return;
		}

		const command = client.commands.values
			.filter((command) => !command.guildId)
			.find((command) => command.name === options.command);
		if (!command)
			return ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						color: client.config.color.no,
						description: cmd.help.run.notFound,
					},
				],
			});

		const embed = new Embed()
			.setColor(client.config.color.primary)
			.setTitle(
				cmd.help.run.categoryTitle({
					category: getCategoryName(command.category ?? AlyaCategory.Unknown),
				}),
			)
			.setDescription(parseCommand(command));

		await ctx.editOrReply({ embeds: [embed] });
	}
}

function parseCommand(command: Command | ContextMenuCommand): string {
	if (command instanceof ContextMenuCommand) return command.name;

	let content = "";
	const hasSubCommands = command.options?.some(
		(opt) => opt instanceof SubCommand,
	);

	if (hasSubCommands) {
		content =
			command.options
				?.filter((opt) => opt instanceof SubCommand)
				.map(
					(opt) =>
						`**/${command.name} ${opt.name}**\n\`\`\`${opt.description}\`\`\``,
				)
				.join("\n") || "";
	} else {
		content = `**/${command.name}**\n\`\`\`${command.description}\`\`\``;
	}

	return content;
}
