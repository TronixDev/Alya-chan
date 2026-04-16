import {
	type CommandContext,
	Container,
	createStringOption,
	Declare,
	LocalesT,
	Options,
	Separator,
	SubCommand,
	TextDisplay,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions, extractSnowflake } from "#alya/utils";

const option = {
	emoji: createStringOption({
		description: "Emoji ID, mention (<:name:id> / <a:name:id>), or <id>",
		required: true,
		locales: {
			name: "cmd.emoji.sub.remove.options.emoji.name",
			description: "cmd.emoji.sub.remove.options.emoji.description",
		},
	}),
	reason: createStringOption({
		description: "Optional reason (shown in Discord audit log)",
		required: false,
		locales: {
			name: "cmd.emoji.sub.remove.options.reason.name",
			description: "cmd.emoji.sub.remove.options.reason.description",
		},
	}),
};

@Declare({
	name: "remove",
	description: "Remove a custom emoji from this server",
	defaultMemberPermissions: ["ManageGuildExpressions"],
})
@LocalesT("cmd.emoji.sub.remove.name", "cmd.emoji.sub.remove.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class EmojiRemoveCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;
		const guild = await ctx.guild();
		if (!guild) return;
		const { cmd } = await ctx.getLocale();

		const emojiId = extractSnowflake(options.emoji);
		if (!emojiId) {
			await ctx.editOrReply({
				components: [
					new Container()
						.setColor(client.config.color.no ?? 0xff0000)
						.addComponents(
							new TextDisplay().setContent(
								`${client.config.emoji.no} ${cmd.emoji.sub.remove.run.invalid_emoji}`,
							),
							new Separator(),
							new TextDisplay().setContent(
								cmd.requested_by({ user: ctx.author.tag }),
							),
						),
				],
				allowed_mentions: { parse: [] },
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		try {
			await client.emojis.delete(guild.id, emojiId, options.reason);

			const successMessage = cmd.emoji.sub.remove.run.success({ id: emojiId });
			const components = new Container()
				.setColor(client.config.color.primary)
				.addComponents(
					new TextDisplay().setContent(
						`${client.config.emoji.yes} ${successMessage}`,
					),
					new Separator(),
					new TextDisplay().setContent(
						cmd.requested_by({ user: ctx.author.tag }),
					),
				);

			await ctx.editOrReply({
				components: [components],
				allowed_mentions: { parse: [] },
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			const failedMessage = cmd.emoji.sub.remove.run.failed({ error: message });

			await ctx.editOrReply({
				components: [
					new Container()
						.setColor(client.config.color.no ?? 0xff0000)
						.addComponents(
							new TextDisplay().setContent(
								`${client.config.emoji.no} ${failedMessage}`,
							),
							new Separator(),
							new TextDisplay().setContent(
								cmd.requested_by({ user: ctx.author.tag }),
							),
						),
				],
				allowed_mentions: { parse: [] },
				flags: MessageFlags.IsComponentsV2,
			});
		}
	}
}
