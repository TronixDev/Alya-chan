import {
	Declare,
	Options,
	createUserOption,
	type CommandContext,
	SubCommand,
	Container,
	TextDisplay,
	Separator,
	ActionRow,
	Button,
	type ComponentInteraction,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";

const options = {
	opponent: createUserOption({
		description: "Specified user will be your opponent",
		required: true,
	}),
};

@Declare({
	name: "tictactoe",
	description: "Play a game of Tic Tac Toe!",
})
@Options(options)
export default class TicTacToeCommand extends SubCommand {
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
		let gamePhase: "waiting" | "playing" | "ended" = "waiting";
		const gameBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // 0 = empty, 1 = X (author), 2 = O (opponent)
		let player1Turn = true; // true = author's turn, false = opponent's turn
		let gameResult: "win" | "tie" | null = null;
		let winner: string | null = null;

		// Helper functions
		const hasWonGame = (player: number): boolean => {
			// Check diagonal wins
			if (
				gameBoard[0] === gameBoard[4] &&
				gameBoard[0] === gameBoard[8] &&
				gameBoard[0] === player
			) {
				return true;
			}
			if (
				gameBoard[6] === gameBoard[4] &&
				gameBoard[6] === gameBoard[2] &&
				gameBoard[6] === player
			) {
				return true;
			}

			// Check rows and columns
			for (let i = 0; i < 3; i++) {
				// Check row
				if (
					gameBoard[i * 3] === gameBoard[i * 3 + 1] &&
					gameBoard[i * 3] === gameBoard[i * 3 + 2] &&
					gameBoard[i * 3] === player
				) {
					return true;
				}
				// Check column
				if (
					gameBoard[i] === gameBoard[i + 3] &&
					gameBoard[i] === gameBoard[i + 6] &&
					gameBoard[i] === player
				) {
					return true;
				}
			}
			return false;
		};

		const getCurrentPlayerEmoji = () => (player1Turn ? "❌" : "⭕");

		const getTurnMessage = (): string => {
			if (gamePhase === "waiting") {
				return `⏳ **Waiting for ${opponent.username} to accept the challenge...**`;
			} else if (gamePhase === "playing") {
				const currentPlayer = player1Turn ? author.username : opponent.username;
				return `${getCurrentPlayerEmoji()} **It's ${currentPlayer}'s turn!**`;
			} else if (gameResult === "win") {
				return `${getCurrentPlayerEmoji()} **${winner} won the Tic Tac Toe Game!**`;
			} else {
				return `🤝 **The Game tied! No one won the Game!**`;
			}
		};

		const getButtonStyle = (cellValue: number): ButtonStyle => {
			if (cellValue === 1) return ButtonStyle.Danger; // X
			if (cellValue === 2) return ButtonStyle.Primary; // O
			return ButtonStyle.Secondary; // Empty
		};

		const getButtonEmoji = (cellValue: number): string => {
			if (cellValue === 1) return "❌";
			if (cellValue === 2) return "⭕";
			return "➖";
		};

		const getComponents = () => {
			return new Container().addComponents(
				new TextDisplay().setContent(
					`# ⭕ Tic Tac Toe\n\n**Players:**\n❌ ${author.username}\n⭕ ${opponent.username}`,
				),
				new Separator(),
				new TextDisplay().setContent(
					`**Status:** ${getTurnMessage()}\n\n**Goal:** Get 3 in a row to win!\n\n-# ${author.username} vs ${opponent.username}`,
				),
			);
		};

		const getGameButtons = (disabled = false) => {
			if (gamePhase === "waiting") {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("ttt_accept")
							.setEmoji("✅")
							.setLabel("Accept Challenge")
							.setStyle(ButtonStyle.Success)
							.setDisabled(disabled),
						new Button()
							.setCustomId("ttt_decline")
							.setEmoji("❌")
							.setLabel("Decline")
							.setStyle(ButtonStyle.Danger)
							.setDisabled(disabled),
					),
				];
			} else {
				// Game board buttons (3x3 grid)
				const buttons: ActionRow<Button>[] = [];

				for (let row = 0; row < 3; row++) {
					const buttonRow = new ActionRow<Button>();
					for (let col = 0; col < 3; col++) {
						const index = row * 3 + col;
						const cellValue = gameBoard[index];
						if (cellValue === undefined) continue;

						buttonRow.addComponents(
							new Button()
								.setCustomId(`ttt_${index}`)
								.setEmoji(getButtonEmoji(cellValue))
								.setStyle(getButtonStyle(cellValue))
								.setDisabled(
									disabled || cellValue !== 0 || gamePhase === "ended",
								),
						);
					}
					buttons.push(buttonRow);
				}

				return buttons;
			}
		};

		// Send initial message
		const message = await ctx.write(
			{
				components: [getComponents(), ...getGameButtons()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				(i.user.id === author.id || i.user.id === opponent.id) &&
				i.customId.startsWith("ttt_"),
			idle: 300000, // 5 minutes
		});

		collector.run(/ttt_(.+)/, async (interaction: ComponentInteraction) => {
			const action = interaction.customId.split("_")[1];

			if (action === "accept") {
				if (interaction.user.id !== opponent.id) {
					await interaction.write({
						content: "❌ Only the challenged player can accept!",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				gamePhase = "playing";
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

			// Handle game moves
			if (gamePhase === "playing") {
				const action = interaction.customId.split("_")[1];
				if (!action) return;

				const cellIndex = parseInt(action);

				// Check if it's the correct player's turn
				const expectedPlayer = player1Turn ? author : opponent;
				if (interaction.user.id !== expectedPlayer.id) {
					await interaction.write({
						content: "❌ It's not your turn!",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				// Make the move
				gameBoard[cellIndex] = player1Turn ? 1 : 2;

				// Check for win
				if (hasWonGame(1) || hasWonGame(2)) {
					gamePhase = "ended";
					gameResult = "win";
					winner = hasWonGame(1) ? author.username : opponent.username;
					collector.stop("win");
				} else if (!gameBoard.includes(0)) {
					// Board is full - tie
					gamePhase = "ended";
					gameResult = "tie";
					collector.stop("tie");
				} else {
					// Switch turns
					player1Turn = !player1Turn;
				}

				await interaction.update({
					components: [
						getComponents(),
						...getGameButtons(gamePhase === "ended"),
					],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		});

		// Collector end: disable buttons
		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				gamePhase = "ended";
				await ctx.editResponse({
					components: [getComponents(), ...getGameButtons(true)],
				});
			}
		};
	}
}
