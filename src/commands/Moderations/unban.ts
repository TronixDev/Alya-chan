import {
	Command,
	type CommandContext,
	Container,
	createStringOption,
	Declare,
	LocalesT,
	Options,
	Separator,
	TextDisplay,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

const option = {
	user_id: createStringOption({
		description: "ID of the user to unban",
		required: true,
		locales: {
			name: "cmd.unban.options.user_id.name",
			description: "cmd.unban.options.user_id.description",
		},
	}),
	reason: createStringOption({
		description: "Reason for the unban (optional)",
		required: false,
		locales: {
			name: "cmd.unban.options.reason.name",
			description: "cmd.unban.options.reason.description",
		},
	}),
};

@Declare({
	name: "unban",
	description: "Unban a user from this server",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["BanMembers"],
})
@LocalesT("cmd.unban.name", "cmd.unban.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class UnbanCommand extends Command {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;
		const guild = await ctx.guild();
		if (!guild) return;

		const userId = options.user_id.trim();
		const reason = options.reason?.trim() || undefined;
		const { cmd } = await ctx.getLocale();

		if (!/^\d{16,}$/.test(userId)) {
			const components = new Container()
				.setColor(client.config.color.no)
				.addComponents(
					new TextDisplay().setContent(
						`${client.config.emoji.no} ${cmd.unban.run.invalid_user_id}`,
					),
				);

			await ctx.editOrReply({
				flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				components: [components],
				allowed_mentions: { parse: [] },
			});
			return;
		}

		try {
			await guild.bans.remove(userId, reason);

			const successMessage = cmd.unban.run.success({
				userId,
				reason,
			});
			const components = new Container()
				.setColor(client.config.color.yes)
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
			const failedMessage = cmd.unban.run.failed({ error: message });

			const components = new Container()
				.setColor(client.config.color.no)
				.addComponents(
					new TextDisplay().setContent(
						`${client.config.emoji.no} ${failedMessage}`,
					),
				);

			await ctx.editOrReply({
				components: [components],
				allowed_mentions: { parse: [] },
				flags: MessageFlags.IsComponentsV2,
			});
		}
	}
}
