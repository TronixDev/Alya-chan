import {
	Command,
	type CommandContext,
	Container,
	createIntegerOption,
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
	seconds: createIntegerOption({
		description: "Slowmode seconds (0-21600)",
		required: true,
		min_value: 0,
		max_value: 21600,
		locales: {
			name: "cmd.slowmode.options.seconds.name",
			description: "cmd.slowmode.options.seconds.description",
		},
	}),
	reason: createStringOption({
		description: "Reason for slowmode change (optional)",
		required: false,
		locales: {
			name: "cmd.slowmode.options.reason.name",
			description: "cmd.slowmode.options.reason.description",
		},
	}),
};

@Declare({
	name: "slowmode",
	description: "Set slowmode in current channel",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageChannels"],
})
@LocalesT("cmd.slowmode.name", "cmd.slowmode.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class SlowmodeCommand extends Command {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;
		const guild = await ctx.guild();
		const channel = await ctx.channel();
		if (!(guild && channel)) return;

		const seconds = options.seconds;
		const reason = options.reason?.trim() || undefined;
		const { cmd } = await ctx.getLocale();

		try {
			await client.channels.edit(
				channel.id,
				{
					rate_limit_per_user: seconds,
				},
				{ guildId: guild.id, reason },
			);

			const components = new Container()
				.setColor(client.config.color.yes)
				.addComponents(
					new TextDisplay().setContent(
						`${client.config.emoji.yes} ${cmd.slowmode.run.success({ seconds })}`,
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
			const components = new Container()
				.setColor(client.config.color.no)
				.addComponents(
					new TextDisplay().setContent(
						`${client.config.emoji.no} ${cmd.slowmode.run.failed({ error: message })}`,
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
