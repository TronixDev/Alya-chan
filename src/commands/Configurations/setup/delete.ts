import {
	type CommandContext,
	Declare,
	LocalesT,
	SubCommand,
	Container,
	TextDisplay,
	ActionRow,
	Button,
	type ComponentInteraction,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";

@Declare({
	name: "delete",
	description: "Delete the music/global chat setup",
})
@LocalesT("cmd.setup.sub.delete.name", "cmd.setup.sub.delete.description")
export default class DeleteSubcommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client, guildId, author } = ctx;
		if (!guildId) return;

		// Check what setups exist
		const chatbotSetup = await client.database.getChatbotSetup(guildId);
		const globalChatSetup = await client.database.getGlobalChatChannel(guildId);

		if (!chatbotSetup && !globalChatSetup) {
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} No setup found to delete.`,
					},
				],
			});
			return;
		}

		// Prompt user for what to delete
		const prompt = new Container().addComponents(
			new TextDisplay().setContent(`Select which setup you want to delete:`),
		);
		const buttons = new ActionRow<Button>().addComponents(
			new Button()
				.setCustomId("delete_chatbot")
				.setLabel("Delete Chatbot")
				.setStyle(ButtonStyle.Danger)
				.setDisabled(!chatbotSetup),
			new Button()
				.setCustomId("delete_globalchat")
				.setLabel("Delete Global Chat")
				.setStyle(ButtonStyle.Danger)
				.setDisabled(!globalChatSetup),
			new Button()
				.setCustomId("delete_both")
				.setLabel("Delete Both")
				.setStyle(ButtonStyle.Danger)
				.setDisabled(!(chatbotSetup && globalChatSetup)),
		);

		const message = await ctx.write(
			{
				components: [prompt, buttons],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) => i.user.id === author.id,
			idle: 60000, // 1 minute
		});

		collector.run(
			/delete_(chatbot|globalchat|both)/,
			async (interaction: ComponentInteraction) => {
				const deleted: string[] = [];
				let success = false;
				if (interaction.customId === "delete_chatbot") {
					await client.database.deleteChatbotSetup(guildId);
					deleted.push("Chatbot");
				}
				if (interaction.customId === "delete_globalchat") {
					await client.database.deleteGlobalChatChannel(guildId);
					deleted.push("Global Chat");
				}
				if (interaction.customId === "delete_both") {
					await client.database.deleteChatbotSetup(guildId);
					await client.database.deleteGlobalChatChannel(guildId);
					deleted.push("Chatbot", "Global Chat");
				}
				success = deleted.length > 0;
				await interaction.update({
					components: [
						new Container().addComponents(
							new TextDisplay().setContent(
								success
									? `${client.config.emoji.yes} Successfully deleted: ${deleted.join(", ")}`
									: `${client.config.emoji.no} Failed to delete setup.`,
							),
						),
					],
					flags: MessageFlags.IsComponentsV2,
				});
				collector.stop("done");
			},
		);

		// Collector end: disable buttons if idle
		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				await message.edit({
					components: [prompt, buttons],
				});
			}
		};
	}
}
