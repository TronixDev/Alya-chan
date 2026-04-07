import {
	Command,
	type CommandContext,
	Container,
	createStringOption,
	createUserOption,
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
	user: createUserOption({
		description: "User to kick",
		required: true,
		locales: {
			name: "cmd.kick.options.user.name",
			description: "cmd.kick.options.user.description",
		},
	}),
	reason: createStringOption({
		description: "Reason for the kick (optional)",
		required: false,
		locales: {
			name: "cmd.kick.options.reason.name",
			description: "cmd.kick.options.reason.description",
		},
	}),
};

@Declare({
	name: "kick",
	description: "Kick a member from this server",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["KickMembers"],
})
@LocalesT("cmd.kick.name", "cmd.kick.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class KickCommand extends Command {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;
		const guild = await ctx.guild();
		if (!guild) return;

		const target = options.user;
		const reason = options.reason?.trim() || undefined;
		const { cmd } = await ctx.getLocale();

		if (target.id === ctx.author.id) {
			const components = new Container()
				.setColor(client.config.color.no)
				.addComponents(
					new TextDisplay().setContent(
						`${client.config.emoji.no} ${cmd.kick.run.cant_self}`,
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
			await guild.members.kick(target.id, reason);

			const successMessage = cmd.kick.run.success({
				user: target.tag,
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
			const failedMessage = cmd.kick.run.failed({ error: message });

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
