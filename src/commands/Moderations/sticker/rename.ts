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
	sticker: createStringOption({
		description: "Sticker ID",
		required: true,
		locales: {
			name: "cmd.sticker.sub.rename.options.sticker.name",
			description: "cmd.sticker.sub.rename.options.sticker.description",
		},
	}),
	new_name: createStringOption({
		description: "New sticker name (2-30 characters)",
		required: true,
		min_length: 2,
		max_length: 30,
		locales: {
			name: "cmd.sticker.sub.rename.options.new_name.name",
			description: "cmd.sticker.sub.rename.options.new_name.description",
		},
	}),
};

@Declare({
	name: "rename",
	description: "Rename a custom sticker in this server",
	defaultMemberPermissions: ["ManageGuildExpressions"],
})
@LocalesT("cmd.sticker.sub.rename.name", "cmd.sticker.sub.rename.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class StickerRenameCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;
		const guild = await ctx.guild();
		if (!guild) return;
		const { cmd } = await ctx.getLocale();

		const stickerId = extractSnowflake(options.sticker);
		if (!stickerId) {
			await ctx.editOrReply({
				components: [
					new Container()
						.setColor(client.config.color.no ?? 0xff0000)
						.addComponents(
							new TextDisplay().setContent(
								`${client.config.emoji.no} ${cmd.sticker.sub.rename.run.invalid_sticker}`,
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
			const updated = await guild.stickers.edit(stickerId, {
				name: options.new_name,
			});

			const successMessage = cmd.sticker.sub.rename.run.success({
				id: stickerId,
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
			const failedMessage = cmd.sticker.sub.rename.run.failed({
				error: message,
			});

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
