import {
	AttachmentBuilder,
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
import { AlyaOptions } from "#alya/utils";

const option = {
	source: createStringOption({
		description: "Emoji mention (<:name:id>) or image URL",
		required: true,
		locales: {
			name: "cmd.emoji.sub.steal.options.source.name",
			description: "cmd.emoji.sub.steal.options.source.description",
		},
	}),
	name: createStringOption({
		description: "Override emoji name (optional)",
		required: false,
		min_length: 2,
		max_length: 32,
		locales: {
			name: "cmd.emoji.sub.steal.options.name.name",
			description: "cmd.emoji.sub.steal.options.name.description",
		},
	}),
};

/** Static: `<:name:id>`, animated: `<a:name:id>`. */
function parseCustomEmoji(input: string) {
	const match = input.match(/^<(?:(a):|:)([a-zA-Z0-9_]{2,32}):(\d{16,})>$/);
	if (!match) return null;
	const animated = !!match[1];
	const name: string | null = match[2] ?? null;
	const id = match[3];
	return { id, name, animated };
}

function isHttpUrl(input: string): boolean {
	try {
		const url = new URL(input);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

@Declare({
	name: "steal",
	description: "Steal an emoji from another server or URL",
	defaultMemberPermissions: ["ManageGuildExpressions"],
})
@LocalesT("cmd.emoji.sub.steal.name", "cmd.emoji.sub.steal.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class EmojiStealCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;
		const guild = await ctx.guild();
		if (!guild) return;
		const { cmd } = await ctx.getLocale();

		const raw = options.source.trim();
		const parsed = parseCustomEmoji(raw);

		let imageUrl: string | null = null;
		let name: string | null = options.name?.trim() ?? null;

		if (parsed) {
			const ext = parsed.animated ? "gif" : "png";
			imageUrl = `https://cdn.discordapp.com/emojis/${parsed.id}.${ext}?quality=lossless&size=128`;
			if (!name && parsed.name) name = parsed.name;
		} else if (isHttpUrl(raw)) {
			imageUrl = raw;
		}

		if (!imageUrl) {
			await ctx.editOrReply({
				components: [
					new Container()
						.setColor(client.config.color.no ?? 0xff0000)
						.addComponents(
							new TextDisplay().setContent(
								`${client.config.emoji.no} ${cmd.emoji.sub.steal.run.invalid_source}`,
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

		if (!name) {
			try {
				const url = new URL(imageUrl);
				const base = url.pathname.split("/").pop() ?? "stolen_emoji";
				name = base.split(".")[0]?.slice(0, 32) || "stolen_emoji";
			} catch {
				name = "stolen_emoji";
			}
		}

		const finalName = name ?? "stolen_emoji";
		const attachment = new AttachmentBuilder().setFile(
			"url",
			imageUrl as string,
		);

		try {
			const created = await guild.emojis.create({
				name: finalName,
				image: attachment,
			});

			const successMessage = cmd.emoji.sub.steal.run.success({
				name: created.name ?? finalName,
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
			const failedMessage = cmd.emoji.sub.steal.run.failed({ error: message });

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
