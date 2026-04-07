import {
	Command,
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
} from "seyfert";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "stop",
	description: "Stop the player",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	aliases: ["sp"],
})
@LocalesT("cmd.stop.name", "cmd.stop.description")
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Music })
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class StopCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { component } = await ctx.getLocale();
		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		await player.destroy();

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.stop} ${component.stop.title}`,
					description: component.stop.description,
					color: client.config.color.primary,
				},
			],
		});
	}
}
