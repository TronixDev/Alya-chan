import {
	Command,
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
} from "seyfert";
import { AlyaOptions } from "#alya/utils";
import { AlyaCategory } from "#alya/types";

@Declare({
	name: "shuffle",
	description: "Shuffle the queue",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	aliases: ["shu", "sh", "shuf"],
})
@LocalesT("cmd.shuffle.name", "cmd.shuffle.description")
@AlyaOptions({
	cooldown: 5,
	category: AlyaCategory.Music,
})
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
	"checkQueue",
])
export default class ShuffleCommand extends Command {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { component } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		await player.queue.shuffle();
		await ctx.editOrReply({
			embeds: [
				{
					description: `${client.config.emoji.shuffle} ${component.shuffle.description}`,
					color: client.config.color.primary,
				},
			],
		});
	}
}
