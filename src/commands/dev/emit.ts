import {
	Command,
	type CommandContext,
	createStringOption,
	Declare,
	type Guild,
	Options,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaOptions } from "#alya/utils";

const option = {
	event: createStringOption({
		description: "The event to emit.",
		required: true,
		choices: [
			{
				name: "guildCreate",
				value: "GUILD_CREATE",
			},
			{
				name: "guildDelete",
				value: "GUILD_DELETE",
			},
		] as const,
	}),
};

@Declare({
	name: "emit",
	description: "Emit a event.",
	defaultMemberPermissions: ["ManageGuild", "Administrator"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AlyaOptions({ onlyDeveloper: true })
@Options(option)
export default class ReloadCommand extends Command {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { options, client } = ctx;
		const { event } = options;

		const guild = ctx.guild();
		if (!guild) return;

		switch (event) {
			case "GUILD_CREATE":
			case "GUILD_DELETE":
				{
					await client.events.values[event]?.run(
						guild as unknown as Guild<"create">,
						client,
						ctx.shardId,
					);
					await ctx.editOrReply({
						flags: MessageFlags.Ephemeral,
						content: "",
						embeds: [
							{
								description: `\`✅\` The event \`${event}\` has been emitted.`,
								color: client.config.color.yes,
							},
						],
					});
				}
				break;
		}
	}
}
