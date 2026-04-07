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
		description: "User whose nickname you want to change",
		required: true,
		locales: {
			name: "cmd.nick.options.user.name",
			description: "cmd.nick.options.user.description",
		},
	}),
	nickname: createStringOption({
		description: "New nickname (leave empty to reset)",
		required: false,
		max_length: 32,
		locales: {
			name: "cmd.nick.options.nickname.name",
			description: "cmd.nick.options.nickname.description",
		},
	}),
	reason: createStringOption({
		description: "Reason for nickname change (optional)",
		required: false,
		locales: {
			name: "cmd.nick.options.reason.name",
			description: "cmd.nick.options.reason.description",
		},
	}),
};

@Declare({
	name: "nick",
	description: "Change or reset a member nickname",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageNicknames"],
})
@LocalesT("cmd.nick.name", "cmd.nick.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class NickCommand extends Command {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;
		const guild = await ctx.guild();
		if (!guild) return;

		const target = options.user;
		const reason = options.reason?.trim() || undefined;
		const nickname = options.nickname?.trim() || null;
		const { cmd } = await ctx.getLocale();

		try {
			await guild.members.edit(target.id, { nick: nickname }, reason);

			const successMessage = cmd.nick.run.success({
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
			const failedMessage = cmd.nick.run.failed({ error: message });
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
