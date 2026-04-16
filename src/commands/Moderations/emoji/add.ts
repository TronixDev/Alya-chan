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
		description: "Name of the emoji (2-32 characters)",
		required: true,
		min_length: 2,
		max_length: 32,
		locales: {
			name: "cmd.emoji.sub.add.options.name.name",
			description: "cmd.emoji.sub.add.options.name.description",
		},
	}),
	image: createAttachmentOption({
		description: "Emoji image (PNG/JPG/WebP)",
		required: true,
		locales: {
			name: "cmd.emoji.sub.add.options.image.name",
			description: "cmd.emoji.sub.add.options.image.description",
		},
	}),
};

@Declare({
	name: "add",
	description: "Add a custom emoji to this server",
	defaultMemberPermissions: ["ManageGuildExpressions"],
})
@LocalesT("cmd.emoji.sub.add.name", "cmd.emoji.sub.add.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class EmojiAddCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;
		const guild = await ctx.guild();
		if (!guild) return;
		const { cmd } = await ctx.getLocale();

		try {
			const created = await guild.emojis.create({
				name: options.name,
				image: options.image,
			});

			const finalName = created.name ?? options.name;
			const successMessage = cmd.emoji.sub.add.run.success({
				name: finalName,
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
			const failedMessage = cmd.emoji.sub.add.run.failed({ error: message });

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
