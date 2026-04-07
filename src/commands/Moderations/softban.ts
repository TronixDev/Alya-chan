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
		description: "User to softban",
		required: true,
		locales: {
			name: "cmd.softban.options.user.name",
			description: "cmd.softban.options.user.description",
		},
	}),
	reason: createStringOption({
		description: "Reason for the softban (optional)",
		required: false,
		locales: {
			name: "cmd.softban.options.reason.name",
			description: "cmd.softban.options.reason.description",
		},
	}),
};

@Declare({
	name: "softban",
	description: "Softban a member (ban + unban, removes recent messages)",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["BanMembers"],
})
@LocalesT("cmd.softban.name", "cmd.softban.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class SoftbanCommand extends Command {
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
						`${client.config.emoji.no} ${cmd.softban.run.cant_self}`,
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
			await guild.members.ban(
				target.id,
				{ delete_message_seconds: 86_400 },
				reason,
			);
			await guild.bans.remove(target.id, reason);

			const successMessage = cmd.softban.run.success({
				user: target.tag,
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
			const failedMessage = cmd.softban.run.failed({ error: message });
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
