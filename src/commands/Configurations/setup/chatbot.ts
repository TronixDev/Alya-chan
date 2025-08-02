import {
	SubCommand,
	type CommandContext,
	Declare,
	Options,
	createChannelOption,
} from "seyfert";
import { AlyaOptions } from "#alya/utils";
import { AlyaCategory } from "#alya/types";
import { ChannelType, MessageFlags } from "seyfert/lib/types";

const option = {
	channel: createChannelOption({
		description: "Select a channel for the chatbot",
		required: true,
		channel_types: [ChannelType.GuildText],
	}),
};

@Declare({
	name: "chatbot",
	description: "Setup chatbot channel",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@AlyaOptions({ cooldown: 10, category: AlyaCategory.Configurations })
@Options(option)
export default class ChatbotSetupCommand extends SubCommand {
	public override async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		if (!guildId) return;

		if (!options.channel) return;

		const existingSetup = await client.database.getChatbotSetup(guildId);
		if (existingSetup) {
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} Chatbot channel is already set: <#${existingSetup.channelId}>`,
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
					description: `${client.config.emoji.yes} Chatbot channel successfully set: <#${options.channel.id}>`,
				},
			],
			flags: MessageFlags.Ephemeral,
		});
	}
}
