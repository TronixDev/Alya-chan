import {
	type CommandContext,
	Container,
	createAttachmentOption,
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
import { AlyaOptions } from "#alya/utils";

const option = {
	name: createStringOption({
		description: "Sticker name (2-30 characters)",
		required: true,
		min_length: 2,
		max_length: 30,
		locales: {
			name: "cmd.sticker.sub.add.options.name.name",
			description: "cmd.sticker.sub.add.options.name.description",
		},
	}),
	description: createStringOption({
		description: "Sticker description (empty or 2-100 characters)",
		required: true,
		min_length: 0,
		max_length: 100,
		locales: {
			name: "cmd.sticker.sub.add.options.description.name",
			description: "cmd.sticker.sub.add.options.description.description",
		},
	}),
	tags: createStringOption({
		description: "Sticker tags (unicode emoji name, 2-200 characters)",
		required: true,
		min_length: 2,
		max_length: 200,
		locales: {
			name: "cmd.sticker.sub.add.options.tags.name",
			description: "cmd.sticker.sub.add.options.tags.description",
		},
	}),
	file: createAttachmentOption({
		description: "Sticker file (PNG/APNG/GIF/Lottie JSON)",
		required: true,
		locales: {
			name: "cmd.sticker.sub.add.options.file.name",
			description: "cmd.sticker.sub.add.options.file.description",
		},
	}),
};

@Declare({
	name: "add",
	description: "Add a custom sticker to this server",
	defaultMemberPermissions: ["ManageGuildExpressions"],
})
@LocalesT("cmd.sticker.sub.add.name", "cmd.sticker.sub.add.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class StickerAddCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;
		const guild = await ctx.guild();
		if (!guild) return;
		const { cmd } = await ctx.getLocale();

		try {
			const created = await guild.stickers.create({
				name: options.name,
				description: options.description,
				tags: options.tags,
				file: options.file,
			});

			const successMessage = cmd.sticker.sub.add.run.success({
				name: created.name ?? options.name,
				id: created.id,
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
			const failedMessage = cmd.sticker.sub.add.run.failed({ error: message });

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
