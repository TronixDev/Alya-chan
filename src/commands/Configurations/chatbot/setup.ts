import {
	type CommandContext,
	createChannelOption,
	Declare,
	LocalesT,
	Options,
	SubCommand,
} from "seyfert";
import { ChannelType, MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

const option = {
	channel: createChannelOption({
		description: "Select a channel for the chatbot",
		required: true,
		channel_types: [ChannelType.GuildText],
		locales: {
			name: "cmd.chatbot.sub.setup.options.channel.name",
			description: "cmd.chatbot.sub.setup.options.channel.description",
		},
	}),
};

@Declare({
	name: "setup",
	description: "Setup chatbot channel",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@AlyaOptions({ cooldown: 10, category: AlyaCategory.Configurations })
@Options(option)
@LocalesT("cmd.chatbot.sub.setup.name", "cmd.chatbot.sub.setup.description")
export default class ChatbotSetupCommand extends SubCommand {
	public override async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		const { cmd } = await ctx.getLocale();
		if (!guildId) return;

		if (!options.channel) return;

		const existingSetup = await client.database.getChatbotSetup(guildId);
		if (existingSetup) {
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.chatbot.sub.setup.run.already_set({ channelId: existingSetup.channelId })}`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await client.database.createChatbotSetup(guildId, options.channel.id);
		await ctx.editOrReply({
			embeds: [
				{
					color: client.config.color.yes,
					description: `${client.config.emoji.yes} ${cmd.chatbot.sub.setup.run.success({ channelId: options.channel.id })}`,
				},
			],
			flags: MessageFlags.Ephemeral,
		});
	}
}
