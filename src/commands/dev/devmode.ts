import {
	Command,
	type CommandContext,
	createBooleanOption,
	Declare,
	Options,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaOptions } from "#alya/utils";

const option = {
	enable: createBooleanOption({
		description: "Enable or disable developer mode",
		required: false,
	}),
};

@Declare({
	name: "devmode",
	description:
		"Toggle developer mode - restricts bot access to developers only",
	defaultMemberPermissions: ["ManageGuild", "Administrator"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AlyaOptions({ onlyDeveloper: true })
@Options(option)
export default class DevModeCommand extends Command {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { options, client } = ctx;
		const { enable } = options;

		const alyaCache = client.alyaCache;

		// If no option provided, toggle current state
		const currentState = alyaCache?.isDevModeEnabled?.() ?? false;
		const newState = enable !== undefined ? enable : !currentState;

		// Set the new devmode state
		alyaCache?.setDevMode?.(newState);

		const statusText = newState ? "enabled" : "disabled";
		const statusEmoji = newState ? "🔒" : "🔓";
		const statusColor = newState
			? client.config.color.warn
			: client.config.color.yes;

		await ctx.editOrReply({
			flags: MessageFlags.Ephemeral,
			embeds: [
				{
					title: `${statusEmoji} Developer Mode ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
					description: newState
						? "🔒 Bot is now restricted to developers only. Regular users cannot use any commands."
						: "🔓 Bot is now accessible to all users. All commands are available for everyone.",
					color: statusColor,
					fields: [
						{
							name: "Status",
							value: `Developer Mode: **${statusText.toUpperCase()}**`,
							inline: true,
						},
						{
							name: "Access",
							value: newState ? "Developers Only" : "All Users",
							inline: true,
						},
					],
					footer: {
						text: "This setting persists until manually changed or bot restart",
					},
				},
			],
		});

		// Log the change
		client.logger.info(
			`[DevMode] Developer mode ${statusText} by ${ctx.author.username} (${ctx.author.id})`,
		);
	}
}
