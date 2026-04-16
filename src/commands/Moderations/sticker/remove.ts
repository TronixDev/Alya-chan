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
			name: "cmd.sticker.sub.remove.options.sticker.name",
			description: "cmd.sticker.sub.remove.options.sticker.description",
		},
	}),
	reason: createStringOption({
		description: "Optional reason (audit log)",
		required: false,
		locales: {
			name: "cmd.sticker.sub.remove.options.reason.name",
			description: "cmd.sticker.sub.remove.options.reason.description",
		},
	}),
};

@Declare({
	name: "remove",
	description: "Remove a custom sticker from this server",
	defaultMemberPermissions: ["ManageGuildExpressions"],
})
@LocalesT("cmd.sticker.sub.remove.name", "cmd.sticker.sub.remove.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class StickerRemoveCommand extends SubCommand {
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
								`${client.config.emoji.no} ${cmd.sticker.sub.remove.run.invalid_sticker}`,
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
			await guild.stickers.delete(stickerId, options.reason);

			const successMessage = cmd.sticker.sub.remove.run.success({
				id: stickerId,
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
			const failedMessage = cmd.sticker.sub.remove.run.failed({
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
