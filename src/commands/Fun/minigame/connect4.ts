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
	name: "connect4",
	description: "Play a game of Connect4!",
})
@Options(options)
export default class Connect4Command extends SubCommand {
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
		const ROWS = 6;
		const COLS = 7;
		const board: string[][] = Array(ROWS)
			.fill(0)
			.map(() => Array(COLS).fill("⚪"));
		let currentPlayer = 1; // 1 for author, 2 for opponent
		let gameOver = false;
		let winner: string | null = null;

		// Helper functions
		const getBoardDisplay = () => {
			let display = board.map((row) => row.join("")).join("\n");
			display += "\n1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣";
			return display;
		};

		const dropPiece = (col: number): boolean => {
			for (let row = ROWS - 1; row >= 0; row--) {
				if (board[row]?.[col] === "⚪") {
					const rowData = board[row];
					if (rowData) {
						rowData[col] = currentPlayer === 1 ? "🔴" : "🟡";
					}
					return true;
				}
			}
			return false; // Column is full
		};

		const checkWin = (): boolean => {
			const piece = currentPlayer === 1 ? "🔴" : "🟡";

			// Check horizontal
			for (let row = 0; row < ROWS; row++) {
				for (let col = 0; col < COLS - 3; col++) {
					const currentRow = board[row];
					if (
						currentRow?.[col] === piece &&
						currentRow?.[col + 1] === piece &&
						currentRow?.[col + 2] === piece &&
						currentRow?.[col + 3] === piece
					) {
						return true;
					}
				}
			}

			// Check vertical
			for (let row = 0; row < ROWS - 3; row++) {
				for (let col = 0; col < COLS; col++) {
					if (
						board[row]?.[col] === piece &&
						board[row + 1]?.[col] === piece &&
						board[row + 2]?.[col] === piece &&
						board[row + 3]?.[col] === piece
					) {
						return true;
					}
				}
			}

			// Check diagonal (ascending)
			for (let row = 3; row < ROWS; row++) {
				for (let col = 0; col < COLS - 3; col++) {
					if (
						board[row]?.[col] === piece &&
						board[row - 1]?.[col + 1] === piece &&
						board[row - 2]?.[col + 2] === piece &&
						board[row - 3]?.[col + 3] === piece
					) {
						return true;
					}
				}
			}

			// Check diagonal (descending)
			for (let row = 0; row < ROWS - 3; row++) {
				for (let col = 0; col < COLS - 3; col++) {
					if (
						board[row]?.[col] === piece &&
						board[row + 1]?.[col + 1] === piece &&
						board[row + 2]?.[col + 2] === piece &&
						board[row + 3]?.[col + 3] === piece
					) {
						return true;
					}
				}
			}

			return false;
		};

		const isBoardFull = (): boolean => {
			const topRow = board[0];
			return topRow ? topRow.every((cell) => cell !== "⚪") : false;
		};

		const getCurrentPlayerName = () =>
			currentPlayer === 1 ? author.username : opponent.username;

		const getComponents = () => {
			let statusText: string;
			if (gameOver) {
				if (winner) {
					statusText = `🎉 **${winner} wins!**`;
				} else {
					statusText = "🤝 **It's a tie!**";
				}
			} else {
				statusText = `${currentPlayer === 1 ? "🔴" : "🟡"} **${getCurrentPlayerName()}'s turn**`;
			}

			return new Container().addComponents(
				new TextDisplay().setContent(
					`# 🔴 Connect Four Game\n\n**Players:**\n🔴 ${author.username}\n🟡 ${opponent.username}\n\n\`\`\`\n${getBoardDisplay()}\n\`\`\``,
				),
				new Separator(),
				new TextDisplay().setContent(
					`**Status:** ${statusText}\n\n**Goal:** Connect 4 pieces in a row!\n\n-# Requested by ${author.username}`,
				),
			);
		};

		const getButtonRows = (disabled = false) => {
			const row1 = new ActionRow<Button>().addComponents(
				new Button()
					.setCustomId("connect4_1")
					.setEmoji("1️⃣")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled),
				new Button()
					.setCustomId("connect4_2")
					.setEmoji("2️⃣")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled),
				new Button()
					.setCustomId("connect4_3")
					.setEmoji("3️⃣")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled),
				new Button()
					.setCustomId("connect4_4")
					.setEmoji("4️⃣")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled),
			);
			const row2 = new ActionRow<Button>().addComponents(
				new Button()
					.setCustomId("connect4_5")
					.setEmoji("5️⃣")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled),
				new Button()
					.setCustomId("connect4_6")
					.setEmoji("6️⃣")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled),
				new Button()
					.setCustomId("connect4_7")
					.setEmoji("7️⃣")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled),
			);
			return [row1, row2];
		};

		// Send initial message
		const message = await ctx.write(
			{
				components: [getComponents(), ...getButtonRows()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				(i.user.id === author.id || i.user.id === opponent.id) &&
				i.customId.startsWith("connect4_"),
			idle: 180000, // 3 minutes
		});

		collector.run(
			/connect4_(\d)/,
			async (interaction: ComponentInteraction) => {
				// Check if it's the correct player's turn
				const expectedPlayer = currentPlayer === 1 ? author : opponent;
				if (interaction.user.id !== expectedPlayer.id) {
					await interaction.write({
						content: "❌ It's not your turn!",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				if (gameOver) return;

				const columnStr = interaction.customId.split("_")[1];
				if (!columnStr) return;
				const column = parseInt(columnStr) - 1;

				// Try to drop piece
				if (!dropPiece(column)) {
					await interaction.write({
						content: "❌ That column is full!",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				// Check for win
				if (checkWin()) {
					gameOver = true;
					winner = getCurrentPlayerName();
				} else if (isBoardFull()) {
					gameOver = true;
					winner = null; // Tie
				} else {
					currentPlayer = currentPlayer === 1 ? 2 : 1; // Switch players
				}

				await interaction.update({
					components: [getComponents(), ...getButtonRows(gameOver)],
					flags: MessageFlags.IsComponentsV2,
				});

				if (gameOver) {
					collector.stop("gameover");
				}
			},
		);

		// Collector end: disable buttons
		collector.stop = async (reason: string) => {
			if (reason === "idle" || reason === "gameover") {
				await message.edit({
					components: [getComponents(), ...getButtonRows(true)],
				});
			}
		};
	}
}
