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
import { AlyaOptions, BOT_VERSION, TimeFormat } from "#alya/utils";

@Declare({
	name: "botinfo",
	description: "Get public information about the bot",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.botinfo.name", "cmd.botinfo.description")
@AlyaOptions({ category: AlyaCategory.Informations, cooldown: 5 })
export default class BotInfoCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		const { client } = ctx;
		const { cmd } = await ctx.getLocale();
		const guildCount = client.cache.guilds?.count() ?? 0;

		const uptimeMs = Math.floor(process.uptime() * 1000);
		const uptime = uptimeMs
			? TimeFormat.toHumanize(uptimeMs)
			: cmd.botinfo.run.unknown;

		const wsPing = Math.floor(client.gateway.latency);
		const shardPing = Math.floor(
			(await client.gateway.get(ctx.shardId)?.ping()) ?? 0,
		);

		const botId = client.me?.id ?? cmd.botinfo.run.unknown;

		const components = new Container()
			.setColor(client.config.color.primary)
			.addComponents(
				new TextDisplay().setContent(
					[
						`## ${client.config.emoji.robot} ${cmd.botinfo.run.title}`,
						cmd.botinfo.run.version({ v: BOT_VERSION }),
						cmd.botinfo.run.uptime({ uptime }),
						cmd.botinfo.run.latency({ ws: wsPing, shard: shardPing }),
						cmd.botinfo.run.servers({ count: guildCount }),
						cmd.botinfo.run.bot_id({ id: botId }),
						"",
						cmd.requested_by({ user: ctx.author.tag }),
					].join("\n"),
				),
				new Separator(),
				new TextDisplay().setContent(cmd.botinfo.run.public_only),
			);

		await ctx.editOrReply({
			components: [components],
			flags: MessageFlags.IsComponentsV2,
		});
	}
}
