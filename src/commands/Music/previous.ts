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
	name: "previous",
	description: "Play the previous track in the queue",
})
@LocalesT("cmd.previous.name", "cmd.previous.description")
@AlyaOptions({
	category: AlyaCategory.Music,
	cooldown: 3,
})
@Middlewares(["checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class PreviousCommand extends Command {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { component } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const track = await player.queue.shiftPrevious();
		if (!track) {
			return await ctx.editOrReply({
				embeds: [
					{
						title: `${client.config.emoji.no} ${component.previous.no_previous}`,
						description: component.previous.no_previous_description,
						color: client.config.color.no,
					},
				],
			});
		}

		await player.queue.add(track, 0);
		await player.play();

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.previous} ${component.previous.title}`,
					description: component.previous.description,
					color: client.config.color.primary,
				},
			],
		});
	}
}
