import {
	Command,
	type CommandContext,
	Container,
	Declare,
	LocalesT,
	Separator,
	TextDisplay,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "serverinfo",
	description: "Get public information about the current server",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.serverinfo.name", "cmd.serverinfo.description")
@AlyaOptions({ category: AlyaCategory.Informations, cooldown: 5 })
export default class ServerInfoCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		const { client } = ctx;
		const { cmd } = await ctx.getLocale();
		const guild = await ctx.guild();
		if (!guild) return;

		const createdAt = guild.createdTimestamp;
		const membersCount = guild.memberCount ?? 0;

		const premiumSubscriptionCount = (
			guild as {
				premiumSubscriptionCount?: number;
			}
		).premiumSubscriptionCount;
		const premiumTier = (guild as { premiumTier?: number }).premiumTier;

		const boosts =
			typeof premiumSubscriptionCount === "number"
				? premiumSubscriptionCount
				: 0;
		const boostTier = typeof premiumTier === "number" ? premiumTier : 0;

		const formatTs = (ms?: number): string =>
			ms ? `<t:${Math.floor(ms / 1000)}:F>` : cmd.serverinfo.run.unknown;

		const ownerMention = guild.ownerId
			? `<@${guild.ownerId}>`
			: cmd.serverinfo.run.unknown;

		const components = new Container()
			.setColor(client.config.color.primary)
			.addComponents(
				new TextDisplay().setContent(
					[
						`## ${client.config.emoji.office} ${guild.name}`,
						cmd.serverinfo.run.owner({ mention: ownerMention }),
						cmd.serverinfo.run.members({ count: membersCount }),
						cmd.serverinfo.run.boosts({
							boosts,
							tier: boostTier,
						}),
						cmd.serverinfo.run.created({ when: formatTs(createdAt) }),
						"",
						cmd.requested_by({ user: ctx.author.tag }),
					].join("\n"),
				),
				new Separator(),
				new TextDisplay().setContent(cmd.serverinfo.run.public_only),
			);

		await ctx.editOrReply({
			components: [components],
			flags: MessageFlags.IsComponentsV2,
		});
	}
}
