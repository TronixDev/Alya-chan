import {
	Command,
	type CommandContext,
	Container,
	createUserOption,
	Declare,
	LocalesT,
	Options,
	Separator,
	TextDisplay,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions, presentTable } from "#alya/utils";

const option = {
	user: createUserOption({
		description: "The user to get information for",
		required: false,
		locales: {
			name: "cmd.userinfo.options.user.name",
			description: "cmd.userinfo.options.user.description",
		},
	}),
};

@Declare({
	name: "userinfo",
	description: "Get public information about a user",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.userinfo.name", "cmd.userinfo.description")
@Options(option)
@AlyaOptions({ category: AlyaCategory.Informations, cooldown: 5 })
export default class UserInfoCommand extends Command {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client } = ctx;
		const { cmd } = await ctx.getLocale();
		const guild = await ctx.guild();
		if (!guild) return;

		const target = ctx.options.user ?? ctx.author;

		// Try to resolve as guild member for join date / roles / boosts.
		const member =
			(await guild.members.fetch(target.id).catch(() => undefined)) ??
			undefined;

		const createdAt = target.createdTimestamp;
		const joinedAt = member?.joinedTimestamp;

		const rolesList = member ? await member.roles.list() : [];
		const roles = rolesList.filter((r) => r.id !== guild.id).slice(0, 10);

		const none = cmd.userinfo.run.none;
		const rolesText =
			roles.length > 0 ? roles.map((r) => `<@&${r.id}>`).join(" ") : none;

		const boosting = Boolean(member?.premiumSince);
		const presence = member?.presence?.();
		const status = presence?.status ?? "offline";

		const formatTs = (ms?: number): string =>
			ms ? `<t:${Math.floor(ms / 1000)}:F>` : cmd.userinfo.run.unknown;

		const rolesValue =
			rolesText.length > 420 ? `${rolesText.slice(0, 420)}…` : rolesText;

		const run = cmd.userinfo.run;
		const table = presentTable([
			[run.table_header_field, run.table_header_value],
			[run.row_id, `\`${target.id}\``],
			[run.row_status, `**${status}**`],
			[run.row_created, formatTs(createdAt)],
			[run.row_joined, formatTs(joinedAt)],
			[run.row_boosting, boosting ? run.yes : run.no],
			[run.row_roles, rolesValue],
		]);

		const displayName = target.globalName ?? target.username ?? target.id;
		const rolesPreview = rolesText === none ? none : rolesValue;

		const components = new Container()
			.setColor(client.config.color.primary)
			.addComponents(
				new TextDisplay().setContent(
					[
						`## ${client.config.emoji.info} ${run.title({ name: displayName })}`,
						"",
						"```",
						table,
						"```",
					].join("\n"),
				),
				new Separator(),
				new TextDisplay().setContent(
					run.roles_footer({ preview: rolesPreview }),
				),
			);

		await ctx.editOrReply({
			components: [components],
			flags: MessageFlags.IsComponentsV2,
		});
	}
}
