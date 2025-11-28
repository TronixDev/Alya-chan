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
	description: "Delete the setup",
})
@LocalesT("cmd.setup.sub.delete.name", "cmd.setup.sub.delete.description")
export default class DeleteSubcommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client, guildId, author } = ctx;
		const { cmd } = await ctx.getLocale();
		if (!guildId) return;

		const globalChatHeaders: Record<string, string> = {};
		if (client.config.globalChat?.apiKey) {
			globalChatHeaders.Authorization = `Bearer ${client.config.globalChat.apiKey}`;
		}

		const chatbotSetup = await client.database.getChatbotSetup(guildId);
		const globalChatSetup = await client.database.getGlobalChatChannel(guildId);

		if (!chatbotSetup && !globalChatSetup) {
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.setup.run.delete.none}`,
					},
				],
			});
			return;
		}

		const prompt = new Container().addComponents(
			new TextDisplay().setContent(cmd.setup.run.delete.prompt),
		);
		const buttons = new ActionRow<Button>().addComponents(
			new Button()
				.setCustomId("delete_chatbot")
				.setLabel(cmd.setup.run.delete.buttons.chatbot)
				.setStyle(ButtonStyle.Danger)
				.setDisabled(!chatbotSetup),
			new Button()
				.setCustomId("delete_globalchat")
				.setLabel(cmd.setup.run.delete.buttons.globalchat)
				.setStyle(ButtonStyle.Danger)
				.setDisabled(!globalChatSetup),
			new Button()
				.setCustomId("delete_both")
				.setLabel(cmd.setup.run.delete.buttons.both)
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

		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) => i.user.id === author.id,
			idle: 60000,
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
					try {
						const response = await fetch(
							`${client.config.globalChat.apiUrl}/remove/${guildId}`,
							{
								method: "DELETE",
								headers: {
									"Content-Type": "application/json",
									...globalChatHeaders,
								},
							},
						);

						const result = await response.json();

						if (response.ok && result.status === "ok") {
							deleted.push("Global Chat");
						} else {
							// Still mark as deleted for UI purposes if it's a "not found" error
							if (result.code === "GUILD_NOT_FOUND") {
								deleted.push("Global Chat (was not registered)");
							}
						}
					} catch {}

					await client.database.deleteGlobalChatChannel(guildId);
					if (
						!deleted.includes("Global Chat") &&
						!deleted.includes("Global Chat (was not registered)")
					) {
						deleted.push("Global Chat");
					}
				}
				if (interaction.customId === "delete_both") {
					await client.database.deleteChatbotSetup(guildId);
					deleted.push("Chatbot");

					try {
						const response = await fetch(
							`${client.config.globalChat.apiUrl}/remove/${guildId}`,
							{
								method: "DELETE",
								headers: {
									"Content-Type": "application/json",
									...globalChatHeaders,
								},
							},
						);

						const result = await response.json();

						if (response.ok && result.status === "ok") {
							deleted.push("Global Chat");
						} else {
							// Still mark as deleted for UI purposes if it's a "not found" error
							if (result.code === "GUILD_NOT_FOUND") {
								deleted.push("Global Chat (was not registered)");
							}
						}
					} catch {}

					await client.database.deleteGlobalChatChannel(guildId);
					if (
						!deleted.includes("Global Chat") &&
						!deleted.includes("Global Chat (was not registered)")
					) {
						deleted.push("Global Chat");
					}
				}
				success = deleted.length > 0;
				await interaction.update({
					components: [
						new Container().addComponents(
							new TextDisplay().setContent(
								success
									? `${client.config.emoji.yes} ${cmd.setup.run.delete.result.success({ list: deleted.join(", ") })}`
									: `${client.config.emoji.no} ${cmd.setup.run.delete.result.fail}`,
							),
						),
					],
					flags: MessageFlags.IsComponentsV2,
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
