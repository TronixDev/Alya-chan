import {
	Declare,
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

interface MineCell {
	isMine: boolean;
	isRevealed: boolean;
	isFlagged: boolean;
	neighborMines: number;
}

@Declare({
	name: "minesweeper",
	description: "Play a game of explosive minesweeper!",
})
export default class MinesweeperCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { author } = ctx;
		const boardSize = 5;
		const mineCount = 5;

		// Create and initialize board
		let board = this.createMinesweeperBoard(boardSize, mineCount);
		let gameOver = false;
		let won = false;
		let blocksRevealed = 0;
		let firstClick = true;

		// Number emojis for mine counts
		const getNumberEmoji = (num: number): string => {
			const numberEmojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];
			return numberEmojis[num] ?? `${num}️⃣`;
		};

		// Helper functions
		const revealSafeArea = (startX: number, startY: number) => {
			const toReveal: { x: number; y: number }[] = [{ x: startX, y: startY }];
			const visited = new Set<string>();

			while (toReveal.length > 0) {
				const current = toReveal.pop();
				if (!current) continue;

				const { x, y } = current;
				const key = `${x},${y}`;

				if (
					visited.has(key) ||
					x < 0 ||
					x >= boardSize ||
					y < 0 ||
					y >= boardSize
				)
					continue;
				visited.add(key);

				const row = board[y];
				if (!row) continue;
				const cell = row[x];
				if (!cell || cell.isMine || cell.isRevealed || cell.isFlagged) continue;

				cell.isRevealed = true;
				blocksRevealed++;

				// If this cell has no neighboring mines, reveal surrounding cells
				if (cell.neighborMines === 0) {
					for (let dy = -1; dy <= 1; dy++) {
						for (let dx = -1; dx <= 1; dx++) {
							toReveal.push({ x: x + dx, y: y + dy });
						}
					}
				}
			}
		};

		const checkWin = (): boolean => {
			let safeSquares = 0;
			for (let y = 0; y < boardSize; y++) {
				for (let x = 0; x < boardSize; x++) {
					const row = board[y];
					if (!row) continue;
					const cell = row[x];
					if (!cell) continue;

					if (!cell.isMine && !cell.isRevealed) {
						return false;
					}
					if (!cell.isMine && cell.isRevealed) {
						safeSquares++;
					}
				}
			}
			return safeSquares > 0; // Ensure at least some progress was made
		};

		const getComponents = () => {
			let statusText: string;
			if (gameOver) {
				if (won) {
					statusText = `🎉 **You won!** You successfully avoided all mines and revealed ${blocksRevealed} blocks.`;
				} else {
					statusText = `💥 **You lost!** Be careful of mines next time. You revealed ${blocksRevealed} blocks.`;
				}
			} else {
				statusText = `💣 **Find all safe blocks!**\n**Mines:** ${mineCount} | **Blocks revealed:** ${blocksRevealed}`;
			}

			return new Container().addComponents(
				new TextDisplay().setContent(
					`# 💣 Minesweeper Game\n\n**Click tiles to reveal them, avoid the mines!**`,
				),
				new Separator(),
				new TextDisplay().setContent(
					`${statusText}\n\n**🚩** Right-click in Discord = Flag (not implemented)\n**💣** Mine | **🟩** Safe | **🔲** Hidden\n\n-# Requested by ${author.username}`,
				),
			);
		};

		const getTileButtons = (disabled = false, revealAll = false) => {
			const buttons: ActionRow<Button>[] = [];

			for (let y = 0; y < boardSize; y++) {
				const buttonRow = new ActionRow<Button>();
				for (let x = 0; x < boardSize; x++) {
					const row = board[y];
					if (!row) continue;
					const cell = row[x];
					if (!cell) continue;

					let emoji = "🔲";
					let style = ButtonStyle.Secondary;

					if (revealAll || cell.isRevealed) {
						if (cell.isMine) {
							emoji = "💣";
							style = won ? ButtonStyle.Success : ButtonStyle.Danger;
						} else if (cell.neighborMines > 0) {
							emoji = getNumberEmoji(cell.neighborMines);
							style = ButtonStyle.Secondary;
						} else {
							emoji = "🟩";
							style = ButtonStyle.Secondary;
						}
					} else if (cell.isFlagged) {
						emoji = "🚩";
						style = ButtonStyle.Primary;
					}

					buttonRow.addComponents(
						new Button()
							.setCustomId(`mine_${x}_${y}`)
							.setEmoji(emoji)
							.setStyle(style)
							.setDisabled(disabled || cell.isRevealed || gameOver),
					);
				}
				buttons.push(buttonRow);
			}

			return buttons;
		};

		// Ensure first click is safe by moving mine if necessary
		const makeFirstClickSafe = (clickX: number, clickY: number) => {
			const clickRow = board[clickY];
			if (!clickRow) return;
			const clickedCell = clickRow[clickX];
			if (!clickedCell) return;

			if (clickedCell.isMine) {
				// Find a safe spot to move this mine
				for (let y = 0; y < boardSize; y++) {
					for (let x = 0; x < boardSize; x++) {
						const row = board[y];
						if (!row) continue;
						const cell = row[x];
						if (!cell) continue;

						if (!cell.isMine && (x !== clickX || y !== clickY)) {
							cell.isMine = true;
							clickedCell.isMine = false;
							// Recalculate neighbor counts
							board = this.calculateNeighborCounts(board, boardSize);
							return;
						}
					}
				}
			}
		};

		// Send initial message
		const message = await ctx.write(
			{
				components: [getComponents(), ...getTileButtons()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		// Collector for tile clicks
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				i.user.id === author.id && i.customId.startsWith("mine_"),
			idle: 300000, // 5 minutes
		});

		collector.run(
			/mine_(\d)_(\d)/,
			async (interaction: ComponentInteraction) => {
				if (gameOver) return;

				const xStr = interaction.customId.split("_")[1];
				const yStr = interaction.customId.split("_")[2];
				if (!xStr || !yStr) return;

				const x = parseInt(xStr);
				const y = parseInt(yStr);
				const row = board[y];
				if (!row) return;
				const cell = row[x];
				if (!cell) return;

				if (cell.isRevealed || cell.isFlagged) return;

				// Make first click safe
				if (firstClick) {
					makeFirstClickSafe(x, y);
					firstClick = false;
				}

				if (cell.isMine) {
					// Game over - hit a mine
					gameOver = true;
					won = false;
				} else {
					// Reveal the safe area
					revealSafeArea(x, y);

					// Check for win
					if (checkWin()) {
						gameOver = true;
						won = true;
					}
				}

				await interaction.update({
					components: [getComponents(), ...getTileButtons(gameOver, gameOver)],
					flags: MessageFlags.IsComponentsV2,
				});

				if (gameOver) {
					collector.stop("gameover");
				}
			},
		);

		// Collector end: disable buttons
		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				gameOver = true;
				await ctx.editResponse({
					components: [getComponents(), ...getTileButtons(true, true)],
				});
			}
		};
	}

	private createMinesweeperBoard(
		size: number,
		mineCount: number,
	): MineCell[][] {
		// Initialize board
		const board = Array(size)
			.fill(null)
			.map(() =>
				Array(size)
					.fill(null)
					.map(() => ({
						isMine: false,
						isRevealed: false,
						isFlagged: false,
						neighborMines: 0,
					})),
			);

		// Place mines randomly
		let minesPlaced = 0;
		while (minesPlaced < mineCount) {
			const row = Math.floor(Math.random() * size);
			const col = Math.floor(Math.random() * size);

			const boardRow = board[row];
			if (boardRow) {
				const cell = boardRow[col];
				if (cell && !cell.isMine) {
					cell.isMine = true;
					minesPlaced++;
				}
			}
		}

		return this.calculateNeighborCounts(board, size);
	}

	private calculateNeighborCounts(
		board: MineCell[][],
		size: number,
	): MineCell[][] {
		// Calculate neighbor mine counts
		for (let i = 0; i < size; i++) {
			for (let j = 0; j < size; j++) {
				const row = board[i];
				if (!row) continue;
				const cell = row[j];
				if (!cell || cell.isMine) continue;

				let count = 0;
				for (let di = -1; di <= 1; di++) {
					for (let dj = -1; dj <= 1; dj++) {
						const ni = i + di;
						const nj = j + dj;
						if (ni >= 0 && ni < size && nj >= 0 && nj < size) {
							const neighborRow = board[ni];
							const neighborCell = neighborRow?.[nj];
							if (neighborCell?.isMine) {
								count++;
							}
						}
					}
				}
				cell.neighborMines = count;
			}
		}
		return board;
	}
}
