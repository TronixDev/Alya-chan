import ky from "ky";
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
	description: "Delete global chat setup",
})
@LocalesT(
	"cmd.globalchat.sub.delete.name",
	"cmd.globalchat.sub.delete.description",
)
export default class GlobalChatDeleteCommand extends SubCommand {
	public override async run(ctx: CommandContext) {
		const { client, guildId, author } = ctx;
		const { cmd } = await ctx.getLocale();
		if (!guildId) return;

		const headers = {
			...(client.config.globalChat?.apiKey && {
				Authorization: `Bearer ${client.config.globalChat.apiKey}`,
			}),
		};

		const prompt = new Container().addComponents(
			new TextDisplay().setContent(cmd.globalchat.sub.delete.run.prompt),
		);
		const buttons = new ActionRow<Button>().addComponents(
			new Button()
				.setCustomId("confirm_delete_globalchat")
				.setLabel(cmd.globalchat.sub.delete.run.buttons.confirm)
				.setStyle(ButtonStyle.Danger),
			new Button()
				.setCustomId("cancel_delete_globalchat")
				.setLabel(cmd.globalchat.sub.delete.run.buttons.cancel)
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
			/confirm_delete_globalchat|cancel_delete_globalchat/,
			async (interaction) => {
				if (interaction.customId === "cancel_delete_globalchat") {
					await interaction.update({
						components: [prompt, buttons],
						flags: MessageFlags.IsComponentsV2,
						content: `${client.config.emoji.no} ${cmd.globalchat.sub.delete.run.cancel}`,
					});
					collector.stop("canceled");
					return;
				}

				let deleted = false;
				try {
					const response = await ky.delete(
						`${client.config.globalChat.apiUrl}/remove/${guildId}`,
						{
							headers,
							throwHttpErrors: false,
						},
					);

					const result = (await response.json()) as { status?: string };
					if (response.ok && result.status === "ok") {
						deleted = true;
					}
				} catch {
					// ignore
				}

				await client.database.deleteGlobalChatChannel(guildId);
				deleted = true;

				await interaction.update({
					components: [],
					flags: MessageFlags.IsComponentsV2,
					content: deleted
						? `${client.config.emoji.yes} ${cmd.globalchat.sub.delete.run.success}`
						: `${client.config.emoji.no} ${cmd.globalchat.sub.delete.run.fail}`,
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
