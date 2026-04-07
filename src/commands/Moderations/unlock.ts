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
	reason: createStringOption({
		description: "Reason for unlock (optional)",
		required: false,
		locales: {
			name: "cmd.unlock.options.reason.name",
			description: "cmd.unlock.options.reason.description",
		},
	}),
};

@Declare({
	name: "unlock",
	description: "Unlock current channel (allow @everyone SendMessages)",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageChannels"],
})
@LocalesT("cmd.unlock.name", "cmd.unlock.description")
@Options(option)
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Moderations })
export default class UnlockCommand extends Command {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;
		const guild = await ctx.guild();
		const channel = await ctx.channel();
		if (!(guild && channel)) return;

		const reason = options.reason?.trim() || undefined;
		const { cmd } = await ctx.getLocale();

		try {
			await client.channels.editOverwrite(
				channel.id,
				guild.id,
				{
					type: 0,
					allow: ["SendMessages"],
				},
				{ guildId: guild.id, reason },
			);

			const components = new Container()
				.setColor(client.config.color.yes)
				.addComponents(
					new TextDisplay().setContent(
						`${client.config.emoji.yes} ${cmd.unlock.run.success}`,
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
						`${client.config.emoji.no} ${cmd.unlock.run.failed({ error: message })}`,
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
