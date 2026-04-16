import {
	ActionRow,
	Button,
	type CommandContext,
	type ComponentInteraction,
	Container,
	Declare,
	Separator,
	SubCommand,
	TextDisplay,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";

@Declare({
	name: "find-emoji",
	description: "Play a game of Find Emoji!",
})
export default class FindEmojiCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { author } = ctx;
		const emojis = ["🍉", "🍇", "🍊", "🍋", "🥭", "🍎", "🍏", "🥝"];
		const boardSize = 4;
		let gamePhase = "memorization"; // "memorization" | "playing" | "ended"

		// Create random board with emojis
		const board = Array(boardSize)
			.fill(null)
			.map(() =>
				Array(boardSize)
					.fill(null)
					.map(() => {
						const randomIndex = Math.floor(Math.random() * emojis.length);
						return emojis[randomIndex] || "🍉";
					}),
			);

		// Select target emoji and ensure it exists on the board
		let targetEmoji: string;
		let targetFound = false;

		// Keep generating target until we find one that exists on board
		do {
			const randomIndex = Math.floor(Math.random() * emojis.length);
			targetEmoji = emojis[randomIndex] || "🍉";
			targetFound = board.some((row) =>
				row.some((cell) => cell === targetEmoji),
			);
		} while (!targetFound);

		// Track revealed tiles
		const revealed = Array(boardSize)
			.fill(null)
			.map(() => Array(boardSize).fill(false));
		let gameWon = false;
		let gameEnded = false;

		// Helper functions
		const getBoardDisplay = (showAll = false) => {
			return board
				.map((row, rowIndex) =>
					row
						.map((cell, colIndex) => {
							if (showAll || revealed[rowIndex]?.[colIndex]) {
								return cell;
							}
							return "🔲";
						})
						.join(" "),
				)
				.join("\n");
		};

		const getComponents = () => {
			let statusText: string;
			let boardToShow: string;

			if (gamePhase === "memorization") {
				statusText = `🧠 **Memorization Phase**\n\nStudy the board! Find all ${targetEmoji} emojis.\nThe board will be hidden in a few seconds...`;
				boardToShow = board.map((row) => row.join(" ")).join("\n");
			} else if (gamePhase === "playing") {
				statusText = `🎯 **Find the ${targetEmoji} emojis!**\n\nClick the tiles to reveal them. Find all ${targetEmoji} to win!`;
				boardToShow = getBoardDisplay();
			} else {
				if (gameWon) {
					statusText = `🎉 **Congratulations!**\n\nYou found all the ${targetEmoji} emojis!`;
				} else {
					statusText = `❌ **Game Over!**\n\nYou clicked the wrong emoji.`;
				}
				boardToShow = getBoardDisplay(true);
			}

			return new Container().addComponents(
				new TextDisplay().setContent(
					`# 🔍 Find Emoji Game\n\n**Target:** ${targetEmoji}\n\n\`\`\`\n${boardToShow}\n\`\`\``,
				),
				new Separator(),
				new TextDisplay().setContent(
					`${statusText}\n\n-# Requested by ${author.username}`,
				),
			);
		};

		const getTileButtons = (disabled = false) => {
			const buttons: ActionRow<Button>[] = [];

			for (let row = 0; row < boardSize; row++) {
				const buttonRow = new ActionRow<Button>();
				for (let col = 0; col < boardSize; col++) {
					const revealedRow = revealed[row];
					const boardRow = board[row];
					const isRevealed = revealedRow?.[col] || false;
					const buttonEmoji = isRevealed ? (boardRow?.[col] ?? "🔲") : "🔲";

					buttonRow.addComponents(
						new Button()
							.setCustomId(`tile_${row}_${col}`)
							.setEmoji(buttonEmoji)
							.setStyle(
								isRevealed ? ButtonStyle.Success : ButtonStyle.Secondary,
							)
							.setDisabled(disabled || isRevealed || gamePhase !== "playing"),
					);
				}
				buttons.push(buttonRow);
			}

			return buttons;
		};

		// Send initial message
		const message = await ctx.write(
			{
				components: [getComponents(), ...getTileButtons(true)],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		// Wait 5 seconds for memorization
		setTimeout(async () => {
			if (gameEnded) return;

			gamePhase = "playing";
			await ctx.editResponse({
				components: [getComponents(), ...getTileButtons()],
				flags: MessageFlags.IsComponentsV2,
			});
		}, 5000);

		// Collector for tile clicks
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				i.user.id === author.id && i.customId.startsWith("tile_"),
			idle: 120000, // 2 minutes
		});

		collector.run(
			/tile_(\d)_(\d)/,
			async (interaction: ComponentInteraction) => {
				if (gamePhase !== "playing" || gameEnded) return;

				const rowStr = interaction.customId.split("_")[1];
				const colStr = interaction.customId.split("_")[2];
				if (!rowStr || !colStr) return;

				const row = parseInt(rowStr, 10);
				const col = parseInt(colStr, 10);

				// Reveal the tile
				const revealedRow = revealed[row];
				const boardRow = board[row];
				if (revealedRow && boardRow) {
					revealedRow[col] = true;
					const clickedEmoji = boardRow[col];

					// Check if clicked emoji is the target
					if (clickedEmoji === targetEmoji) {
						// Check if all target emojis are found
						let allTargetsFound = true;
						for (let r = 0; r < boardSize; r++) {
							for (let c = 0; c < boardSize; c++) {
								const boardRowCheck = board[r];
								const revealedRowCheck = revealed[r];
								if (
									boardRowCheck?.[c] === targetEmoji &&
									!revealedRowCheck?.[c]
								) {
									allTargetsFound = false;
									break;
								}
							}
							if (!allTargetsFound) break;
						}

						if (allTargetsFound) {
							gameWon = true;
							gameEnded = true;
							gamePhase = "ended";
							collector.stop("won");
						}
					} else {
						// Wrong emoji clicked - game over
						gameEnded = true;
						gamePhase = "ended";
						collector.stop("lost");
					}

					await interaction.update({
						components: [getComponents(), ...getTileButtons(gameEnded)],
						flags: MessageFlags.IsComponentsV2,
					});
				}
			},
		);

		// Collector end: disable buttons
		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				gameEnded = true;
				gamePhase = "ended";
				await message.edit({
					components: [getComponents(), ...getTileButtons(true)],
				});
			}
		};
	}
}
