import {
	ActionRow,
	Button,
	type CommandContext,
	type ComponentInteraction,
	Container,
	Declare,
	LocalesT,
	SubCommand,
	TextDisplay,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";

@Declare({
	name: "delete",
	description: "Delete chatbot setup",
})
@LocalesT("cmd.chatbot.sub.delete.name", "cmd.chatbot.sub.delete.description")
export default class ChatbotDeleteCommand extends SubCommand {
	public override async run(ctx: CommandContext) {
		const { client, guildId, author } = ctx;
		const { cmd } = await ctx.getLocale();
		if (!guildId) return;

		const prompt = new Container().addComponents(
			new TextDisplay().setContent(cmd.chatbot.sub.delete.prompt),
		);
		const buttons = new ActionRow<Button>().addComponents(
			new Button()
				.setCustomId("confirm_delete_chatbot")
				.setLabel(cmd.chatbot.sub.delete.buttons.confirm)
				.setStyle(ButtonStyle.Danger),
			new Button()
				.setCustomId("cancel_delete_chatbot")
				.setLabel(cmd.chatbot.sub.delete.buttons.cancel)
				.setStyle(ButtonStyle.Secondary),
		);

		const message = await ctx.write(
			{
				components: [prompt, buttons],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) => i.user.id === author.id,
			idle: 60000,
		});

		collector.run(
			/confirm_delete_chatbot|cancel_delete_chatbot/,
			async (interaction) => {
				if (interaction.customId === "cancel_delete_chatbot") {
					await interaction.update({
						components: [prompt, buttons],
						flags: MessageFlags.IsComponentsV2,
						content: `${client.config.emoji.no} ${cmd.chatbot.sub.delete.cancel}`,
					});
					collector.stop("canceled");
					return;
				}

				await client.database.deleteChatbotSetup(guildId);

				await interaction.update({
					components: [],
					flags: MessageFlags.IsComponentsV2,
					content: `${client.config.emoji.yes} ${cmd.chatbot.sub.delete.run.success}`,
				});
				collector.stop("done");
			},
		);

		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				await message.edit({
					components: [prompt, buttons],
				});
			}
		};
	}
}
