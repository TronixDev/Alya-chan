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
	name: "resume",
	description: "Resume the paused track",
})
@LocalesT("cmd.resume.name", "cmd.resume.description")
@AlyaOptions({
	category: AlyaCategory.Music,
	cooldown: 3,
})
@Middlewares(["checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class ResumeCommand extends Command {
	override async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd, event } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		if (!player.paused) {
			return await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.warn} ${cmd.resume.run.resumed}`,
						color: client.config.color.no,
					},
				],
			});
		}

		await player.resume();

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.play} ${event.music.resume.title}`,
					description: event.music.resume.description,
					color: client.config.color.primary,
				},
			],
		});
	}
}
