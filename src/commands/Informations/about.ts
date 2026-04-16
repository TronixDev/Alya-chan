import {
	ActionRow,
	Button,
	Command,
	type CommandContext,
	type ComponentInteraction,
	Declare,
	Embed,
	LocalesT,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "about",
	description: "Show information about me",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.about.name", "cmd.about.description")
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Informations })
export default class AboutCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		const { client } = ctx;

		const { cmd, event } = await ctx.getLocale();

		const guildCount = client.cache.guilds?.count() ?? 0;
		const userCount = client.cache.users?.count() ?? 0;

		const aboutEmbed = new Embed()
			.setColor(client.config.color.primary)
			.setAuthor({
				name: cmd.about.run.title,
			})
			.setDescription(
				[
					`${client.config.emoji.info} **${cmd.about.run.about_me.title}**`,
					"",
					cmd.about.run.about_me[1]({ bot: `**${client.me.username}**` }),
					"",
					cmd.about.run.about_me[2]({
						character: "**Alisa Mikhailovna Kujou**",
					}),
					"",
					cmd.about.run.about_me[3],
					cmd.about.run.about_me[4],
					"",
					`${client.config.emoji.link} **${cmd.about.run.about_me[5]}**`,
					"",
					`- [${cmd.about.run.about_me[6]}](${client.config.info.inviteLink})`,
					`- [${cmd.about.run.about_me[7]}](${client.config.info.supportServer})`,
					`- [${cmd.about.run.about_me[8]}](${client.config.info.voteLink})`,
					"",
					`${client.config.emoji.info} **${cmd.about.run.about_me[9]}**`,
					"",
					cmd.about.run.about_me[10]({ author: "iaMJ" }),
					cmd.about.run.about_me[11]({ developer: "Tronix Development" }),
					cmd.about.run.about_me[12]({ country: "Indonesia" }),
				].join("\n"),
			)
			.setFooter({
				text: cmd.about.run.footer({ guildCount, userCount }),
			})
			.setTimestamp();

		const contributorsEmbed = new Embed()
			.setColor(client.config.color.primary)
			.setAuthor({
				name: cmd.about.run.contributors.title,
			})
			.setDescription(
				[
					`${client.config.emoji.info} **${cmd.about.run.contributors[1]}**`,
					"",
					`- ${cmd.about.run.contributors[2]({ author: "iaMJ" })}`,
					"",
					`${client.config.emoji.link} **${cmd.about.run.contributors[5]}**`,
					"",
					`- ${cmd.about.run.contributors[6]}`,
					`- ${cmd.about.run.contributors[7]}`,
					"",
					`${client.config.emoji.info} **${cmd.about.run.contributors[8]}**`,
					"",
					cmd.about.run.contributors[9]({
						license: "GNU Affero General Public License v3.0",
					}),
					`**[${cmd.about.run.contributors[10]}](https://github.com/TronixDev/Alya-chan/blob/master/LICENSE)**`,
				].join("\n"),
			)
			.setFooter({
				text: cmd.about.run.footer({ guildCount, userCount }),
			})
			.setTimestamp();

		const packagesEmbed = new Embed()
			.setColor(client.config.color.primary)
			.setAuthor({
				name: cmd.about.run.packages.title,
			})
			.setDescription(
				[
					`${client.config.emoji.list} **${cmd.about.run.packages[1]}**`,
					"",
					"- **[Seyfert](https://seyfert.dev)**",
					"- **[lavalink-client](https://github.com/Tomato6966/lavalink-client)**",
					"- **[Lavalink](https://lavalink.dev)**",
					"- **[Bun](https://bun.sh)**",
				].join("\n"),
			)
			.setFooter({
				text: cmd.about.run.footer({ guildCount, userCount }),
			})
			.setTimestamp();

		const row = new ActionRow<Button>().addComponents(
			new Button()
				.setCustomId("about")
				.setLabel("About")
				.setStyle(ButtonStyle.Primary),
			new Button()
				.setCustomId("contributors")
				.setLabel("Contributors")
				.setStyle(ButtonStyle.Secondary),
			new Button()
				.setCustomId("packages")
				.setLabel("Packages")
				.setStyle(ButtonStyle.Secondary),
		);

		const message = await ctx.write(
			{
				embeds: [aboutEmbed],
				components: [row],
			},
			true,
		);

		const getButtonRow = (activeButton: string) => {
			return new ActionRow<Button>().addComponents(
				new Button()
					.setCustomId("about")
					.setLabel(cmd.about.run.about_me.button)
					.setStyle(
						activeButton === "about"
							? ButtonStyle.Primary
							: ButtonStyle.Secondary,
					)
					.setDisabled(activeButton === "about"),
				new Button()
					.setCustomId("contributors")
					.setLabel(cmd.about.run.contributors.button)
					.setStyle(
						activeButton === "contributors"
							? ButtonStyle.Primary
							: ButtonStyle.Secondary,
					)
					.setDisabled(activeButton === "contributors"),
				new Button()
					.setCustomId("packages")
					.setLabel(cmd.about.run.packages.button)
					.setStyle(
						activeButton === "packages"
							? ButtonStyle.Primary
							: ButtonStyle.Secondary,
					)
					.setDisabled(activeButton === "packages"),
			);
		};

		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				["about", "contributors", "packages"].includes(i.customId),
			idle: 60000,
		});

		collector.run(/./, async (interaction: ComponentInteraction) => {
			if (interaction.user.id !== ctx.author.id) {
				await interaction.write({
					content: `${client.config.emoji.no} ${event.paginator.only_author}`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (interaction.customId === "about") {
				await interaction.update({
					embeds: [aboutEmbed],
					components: [getButtonRow("about")],
				});
			} else if (interaction.customId === "contributors") {
				await interaction.update({
					embeds: [contributorsEmbed],
					components: [getButtonRow("contributors")],
				});
			} else if (interaction.customId === "packages") {
				await interaction.update({
					embeds: [packagesEmbed],
					components: [getButtonRow("packages")],
				});
			}
		});

		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				try {
					const disabledRow = new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("about")
							.setLabel(cmd.about.run.about_me.button)
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true),
						new Button()
							.setCustomId("contributors")
							.setLabel(cmd.about.run.contributors.button)
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true),
						new Button()
							.setCustomId("packages")
							.setLabel(cmd.about.run.packages.button)
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true),
					);

					await message.edit({
						components: [disabledRow],
					});
				} catch (error) {
					client.logger.error("Failed to update buttons after timeout:", error);
				}
			}
		};
	}
}
