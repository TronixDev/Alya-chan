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
		description: "Emoji ID or mention (<:name:id> / <a:name:id>)",
		required: true,
		locales: {
			name: "cmd.emoji.sub.rename.options.emoji.name",
			description: "cmd.emoji.sub.rename.options.emoji.description",
		},
	}),
	new_name: createStringOption({
		description: "New name of the emoji (2-32 characters)",
		required: true,
		min_length: 2,
		max_length: 32,
		locales: {
			name: "cmd.emoji.sub.rename.options.new_name.name",
			description: "cmd.emoji.sub.rename.options.new_name.description",
		},
	}),
};

@Declare({
	name: "rename",
	description: "Rename a custom emoji in this server",
	defaultMemberPermissions: ["ManageGuildExpressions"],
})
@LocalesT("cmd.emoji.sub.rename.name", "cmd.emoji.sub.rename.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class EmojiRenameCommand extends SubCommand {
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
								`${client.config.emoji.no} ${cmd.emoji.sub.rename.run.invalid_emoji}`,
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
			const updated = await client.emojis.edit(guild.id, emojiId, {
				name: options.new_name,
			});

			const successMessage = cmd.emoji.sub.rename.run.success({
				id: emojiId,
				new_name: updated?.name ?? options.new_name,
			});
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
			const failedMessage = cmd.emoji.sub.rename.run.failed({ error: message });

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
