import { Command, type CommandContext, Declare } from "seyfert";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "reload",
	description: "Reload Alya",
	defaultMemberPermissions: ["ManageGuild", "Administrator"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AlyaOptions({ onlyDeveloper: true })
export default class ReloadCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		await ctx.client
			.reload()
			.then(() =>
				ctx.editOrReply({
					content: "",
					embeds: [
						{
							description: `${ctx.client.config.emoji.yes} Alya has been reloaded.`,
							color: ctx.client.config.color.yes,
						},
					],
				}),
			)
			.catch(() =>
				ctx.editOrReply({
					content: "",
					embeds: [
						{
							description: `${ctx.client.config.emoji.no} Something failed during the reload.`,
							color: ctx.client.config.color.no,
						},
					],
				}),
			);
	}
}
