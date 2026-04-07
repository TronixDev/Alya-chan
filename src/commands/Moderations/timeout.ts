import {
	Command,
	type CommandContext,
	Container,
	createIntegerOption,
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
		description: "User to timeout / remove timeout from",
		required: true,
		locales: {
			name: "cmd.timeout.options.user.name",
			description: "cmd.timeout.options.user.description",
		},
	}),
	duration: createIntegerOption({
		description: "Timeout duration in minutes (0 to remove timeout)",
		required: true,
		min_value: 0,
		max_value: 40320, // 28 days
		locales: {
			name: "cmd.timeout.options.duration.name",
			description: "cmd.timeout.options.duration.description",
		},
	}),
	reason: createStringOption({
		description: "Reason for the timeout (optional)",
		required: false,
		locales: {
			name: "cmd.timeout.options.reason.name",
			description: "cmd.timeout.options.reason.description",
		},
	}),
};

@Declare({
	name: "timeout",
	description: "Timeout or un-timeout a member",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ModerateMembers"],
})
@LocalesT("cmd.timeout.name", "cmd.timeout.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class TimeoutCommand extends Command {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;
		const guild = await ctx.guild();
		if (!guild) return;

		const target = options.user;
		const minutes = options.duration;
		const reason = options.reason?.trim() || undefined;
		const { cmd } = await ctx.getLocale();

		if (target.id === ctx.author.id) {
			const components = new Container()
				.setColor(client.config.color.no)
				.addComponents(
					new TextDisplay().setContent(
						`${client.config.emoji.no} ${cmd.timeout.run.cant_self}`,
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
			const member = await guild.members.fetch(target.id).catch(() => null);
			if (!member) {
				const components = new Container()
					.setColor(client.config.color.no)
					.addComponents(
						new TextDisplay().setContent(
							`${client.config.emoji.no} ${cmd.timeout.run.member_not_found}`,
						),
					);

				await ctx.editOrReply({
					flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
					components: [components],
					allowed_mentions: { parse: [] },
				});
				return;
			}

			const seconds = minutes === 0 ? null : minutes * 60;
			await client.members.timeout(guild.id, member.id, seconds, reason);

			if (minutes === 0) {
				const removedMessage = cmd.timeout.run.removed({ user: target.tag });
				const components = new Container()
					.setColor(client.config.color.yes)
					.addComponents(
						new TextDisplay().setContent(
							`${client.config.emoji.yes} ${removedMessage}`,
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
				return;
			}

			const components = new Container()
				.setColor(client.config.color.yes)
				.addComponents(
					new TextDisplay().setContent(
						`${client.config.emoji.yes} ${cmd.timeout.run.success({
							user: target.tag,
							minutes,
						})}`,
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
			const failedMessage = cmd.timeout.run.failed({ error: message });

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
