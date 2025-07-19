import {
	Declare,
	type CommandContext,
	SubCommand,
	Options,
	createUserOption,
	Container,
	TextDisplay,
	Separator,
	ActionRow,
	Button,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";

const options = {
	opponent: createUserOption({
		description: "Specified user will be your opponent",
		required: true,
	}),
};

@Declare({
	name: "rps",
	description: "Play a game of Rock Paper Scissors!",
})
@Options(options)
export default class RockPaperScissorsCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>) {
		const { author } = ctx;
		const opponent = ctx.options.opponent;

		// Validation checks
		if (author.id === opponent.id) {
			const errorComponents = new Container().addComponents(
				new TextDisplay().setContent(
					"❌ **Error:** You cannot play against yourself!",
				),
			);

			return await ctx.editOrReply({
				components: [errorComponents],
				flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
			});
		}

		if (opponent.bot) {
			const errorComponents = new Container().addComponents(
				new TextDisplay().setContent(
					"❌ **Error:** You cannot play against a bot!",
				),
			);

			return await ctx.editOrReply({
				components: [errorComponents],
				flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
			});
		}

		// Game state
		let gamePhase: "waiting" | "choosing" | "reveal" | "ended" = "waiting";
		let player1Choice: string | null = null;
		let player2Choice: string | null = null;
		let gameResult: string | null = null;
		let winner: string | null = null;

		// Choice emojis
		const choices = {
			rock: "🪨",
			paper: "📰",
			scissors: "✂️",
		};

		// Helper functions
		const getChoiceResult = (
			p1: string,
			p2: string,
		): { result: string; winner: string | null } => {
			if (p1 === p2) return { result: "tie", winner: null };

			if (
				(p1 === "rock" && p2 === "scissors") ||
				(p1 === "paper" && p2 === "rock") ||
				(p1 === "scissors" && p2 === "paper")
			) {
				return { result: "win", winner: author.username };
			} else {
				return { result: "lose", winner: opponent.username };
			}
		};

		const getComponents = () => {
			let statusText;
			let choicesDisplay = "";

			if (gamePhase === "waiting") {
				statusText = `⏳ **Waiting for ${opponent.username} to accept the challenge...**`;
			} else if (gamePhase === "choosing") {
				const p1Status = player1Choice ? "✅ Ready" : "⏳ Choosing...";
				const p2Status = player2Choice ? "✅ Ready" : "⏳ Choosing...";
				statusText = `🎮 **Make your choice!**\n\n${author.username}: ${p1Status}\n${opponent.username}: ${p2Status}`;
			} else if (gamePhase === "reveal") {
				const p1Emoji = choices[player1Choice as keyof typeof choices];
				const p2Emoji = choices[player2Choice as keyof typeof choices];
				choicesDisplay = `\n**Choices:**\n${author.username}: ${p1Emoji} ${player1Choice?.charAt(0).toUpperCase()}${player1Choice?.slice(1)}\n${opponent.username}: ${p2Emoji} ${player2Choice?.charAt(0).toUpperCase()}${player2Choice?.slice(1)}`;

				if (gameResult === "tie") {
					statusText = `🤝 **It's a tie!**`;
				} else {
					statusText = `🎉 **${winner} wins!**`;
				}
			}

			return new Container().addComponents(
				new TextDisplay().setContent(
					`# ✂️ Rock Paper Scissors\n\n**Players:**\n🪨 ${author.username}\n🆚\n📰 ${opponent.username}${choicesDisplay}`,
				),
				new Separator(),
				new TextDisplay().setContent(
					`**Rules:**\n🪨 **Rock** crushes ✂️ **Scissors**\n📰 **Paper** covers 🪨 **Rock**\n✂️ **Scissors** cuts 📰 **Paper**\n\n${statusText}\n\n-# Requested by ${author.username}`,
				),
			);
		};

		const getGameButtons = (disabled = false) => {
			if (gamePhase === "waiting") {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("rps_accept")
							.setEmoji("✅")
							.setLabel("Accept Challenge")
							.setStyle(ButtonStyle.Success)
							.setDisabled(disabled),
						new Button()
							.setCustomId("rps_decline")
							.setEmoji("❌")
							.setLabel("Decline")
							.setStyle(ButtonStyle.Danger)
							.setDisabled(disabled),
					),
				];
			} else if (gamePhase === "choosing") {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("rps_rock")
							.setEmoji("🪨")
							.setLabel("Rock")
							.setStyle(ButtonStyle.Primary)
							.setDisabled(disabled),
						new Button()
							.setCustomId("rps_paper")
							.setEmoji("📰")
							.setLabel("Paper")
							.setStyle(ButtonStyle.Primary)
							.setDisabled(disabled),
						new Button()
							.setCustomId("rps_scissors")
							.setEmoji("✂️")
							.setLabel("Scissors")
							.setStyle(ButtonStyle.Primary)
							.setDisabled(disabled),
					),
				];
			} else {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("rps_play_again")
							.setEmoji("🔄")
							.setLabel("Play Again")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(disabled),
						new Button()
							.setCustomId("rps_end")
							.setEmoji("🏁")
							.setLabel("End Game")
							.setStyle(ButtonStyle.Danger)
							.setDisabled(disabled),
					),
				];
			}
		};

		// Send initial message
		const message = (await ctx.write(
			{
				components: [getComponents(), ...getGameButtons()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		)) as any;

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: any) =>
				(i.user.id === author.id || i.user.id === opponent.id) &&
				i.customId.startsWith("rps_"),
			idle: 180000, // 3 minutes
		});

		collector.run(/rps_(.+)/, async (interaction: any) => {
			const action = interaction.customId.split("_")[1];

			if (action === "accept") {
				if (interaction.user.id !== opponent.id) {
					await interaction.write({
						content: "❌ Only the challenged player can accept!",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				gamePhase = "choosing";
				await interaction.update({
					components: [getComponents(), ...getGameButtons()],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			if (action === "decline") {
				if (interaction.user.id !== opponent.id) {
					await interaction.write({
						content: "❌ Only the challenged player can decline!",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				gamePhase = "ended";
				await interaction.update({
					content: `❌ **Challenge declined by ${opponent.username}**`,
					components: [],
				});
				collector.stop("declined");
				return;
			}

			if (["rock", "paper", "scissors"].includes(action)) {
				if (gamePhase !== "choosing") return;

				if (interaction.user.id === author.id) {
					if (player1Choice) {
						await interaction.write({
							content: "❌ You have already made your choice!",
							flags: MessageFlags.Ephemeral,
						});
						return;
					}
					player1Choice = action;
				} else if (interaction.user.id === opponent.id) {
					if (player2Choice) {
						await interaction.write({
							content: "❌ You have already made your choice!",
							flags: MessageFlags.Ephemeral,
						});
						return;
					}
					player2Choice = action;
				} else {
					await interaction.write({
						content: "❌ You are not part of this game!",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				// Check if both players have chosen
				if (player1Choice && player2Choice) {
					const result = getChoiceResult(player1Choice, player2Choice);
					gameResult = result.result;
					winner = result.winner;
					gamePhase = "reveal";

					await interaction.update({
						components: [getComponents(), ...getGameButtons()],
						flags: MessageFlags.IsComponentsV2,
					});
				} else {
					await interaction.update({
						components: [getComponents(), ...getGameButtons()],
						flags: MessageFlags.IsComponentsV2,
					});
				}
				return;
			}

			if (action === "play" && interaction.customId.includes("again")) {
				// Reset game state
				player1Choice = null;
				player2Choice = null;
				gameResult = null;
				winner = null;
				gamePhase = "choosing";

				await interaction.update({
					components: [getComponents(), ...getGameButtons()],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			if (action === "end") {
				gamePhase = "ended";
				await interaction.update({
					content: `🏁 **Game ended by ${interaction.user.username}**`,
					components: [getComponents()],
					flags: MessageFlags.IsComponentsV2,
				});
				collector.stop("ended");
				return;
			}
		});

		// Collector end: disable buttons
		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				await ctx.editResponse({
					components: [getComponents(), ...getGameButtons(true)],
				});
			}
		};
	}
}
