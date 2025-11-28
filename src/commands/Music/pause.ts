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
	name: "pause",
	description: "Pause the current track",
})
@AlyaOptions({
	category: AlyaCategory.Music,
	cooldown: 3,
})
@LocalesT("cmd.pause.name", "cmd.pause.description")
@Middlewares(["checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class PauseCommand extends Command {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd, event } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		if (player.paused) {
			return await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.warn} ${cmd.pause.run.paused}`,
						color: client.config.color.no,
					},
				],
			});
		}

		await player.pause();

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.pause} ${event.music.pause.title}`,
					description: event.music.pause.description,
					color: client.config.color.primary,
				},
			],
		});
	}
}
