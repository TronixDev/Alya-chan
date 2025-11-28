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
	name: "2048",
	description: "Play a game of 2048!",
})
export default class TwoZeroFourEightCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { author } = ctx;
		const size = 4;
		let score = 0;
		const board: number[][] = Array(size)
			.fill(0)
			.map(() => Array(size).fill(0));

		// Place two random tiles
		this.addRandomTile(board);
		this.addRandomTile(board);

		// Helper to create board display
		const getBoardDisplay = () => {
			return board
				.map((row) =>
					row
						.map((cell) => (cell === 0 ? "    " : cell.toString().padStart(4)))
						.join("|"),
				)
				.join("\n");
		};

		// Helper to create main components
		const getComponents = (isGameOver = false) => {
			return new Container().addComponents(
				new TextDisplay().setContent(
					`# 🎯 2048 Game\n\n**Current Board:**\n\`\`\`\n${getBoardDisplay()}\n\`\`\`\n\n**Score:** ${score}`,
				),
				new Separator(),
				new TextDisplay().setContent(
					isGameOver
						? `**Game Over!**\nYour final score: **${score}**\n\n-# Requested by ${author.username}`
						: `**How to Play:**\n⬆️ **Up** - Move tiles up\n⬇️ **Down** - Move tiles down\n⬅️ **Left** - Move tiles left\n➡️ **Right** - Move tiles right\n\n**Goal:** Combine tiles to reach 2048!\n\n-# Requested by ${author.username}`,
				),
			);
		};

		// Helper to create button row
		const getButtonRow = (disabled = false) => {
			return new ActionRow<Button>().addComponents(
				new Button()
					.setCustomId("2048_up")
					.setEmoji("⬆️")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled),
				new Button()
					.setCustomId("2048_down")
					.setEmoji("⬇️")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled),
				new Button()
					.setCustomId("2048_left")
					.setEmoji("⬅️")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled),
				new Button()
					.setCustomId("2048_right")
					.setEmoji("➡️")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled),
			);
		};

		// Send initial message
		const message = await ctx.write(
			{
				components: [getComponents(), getButtonRow()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				i.user.id === author.id && i.customId.startsWith("2048_"),
			idle: 6000, // 2 minutes
		});

		collector.run(
			/2048_(up|down|left|right)/,
			async (interaction: ComponentInteraction) => {
				// Movement logic
				const direction = interaction.customId.split("_")[1];
				let moved = false;
				if (direction === "up") {
					moved = this.shiftVertical(board, "up", (v) => {
						score += v;
					});
				}
				if (direction === "down") {
					moved = this.shiftVertical(board, "down", (v) => {
						score += v;
					});
				}
				if (direction === "left") {
					moved = this.shiftHorizontal(board, "left", (v) => {
						score += v;
					});
				}
				if (direction === "right") {
					moved = this.shiftHorizontal(board, "right", (v) => {
						score += v;
					});
				}

				if (moved) this.addRandomTile(board);

				// Check for game over
				if (this.isGameOver(board)) {
					await interaction.update({
						components: [getComponents(true), getButtonRow(true)],
						flags: MessageFlags.IsComponentsV2,
					});
					collector.stop("gameover");
					return;
				}

				await interaction.update({
					components: [getComponents(), getButtonRow()],
					flags: MessageFlags.IsComponentsV2,
				});
			},
		);

		// Collector end: disable buttons
		collector.stop = async (reason: string) => {
			if (reason === "idle" || reason === "gameover") {
				await message.edit({
					components: [getComponents(true), getButtonRow(true)],
				});
			}
		};
	}

	// Add a random tile (2 or 4) to the board
	private addRandomTile(grid: number[][]) {
		const emptyCells: { row: number; col: number }[] = [];
		for (let i = 0; i < grid.length; i++) {
			const rowArr = grid[i] ?? [];
			for (let j = 0; j < (rowArr?.length ?? 0); j++) {
				if (typeof rowArr[j] === "number" && rowArr[j] === 0)
					emptyCells.push({ row: i, col: j });
			}
		}
		if (emptyCells.length > 0) {
			const randomCell = emptyCells[
				Math.floor(Math.random() * emptyCells.length)
			] ?? { row: 0, col: 0 };
			const rowArr = grid[randomCell.row] ?? [];
			if (typeof rowArr[randomCell.col] === "number") {
				rowArr[randomCell.col] = Math.random() < 0.9 ? 2 : 4;
				grid[randomCell.row] = rowArr;
			}
		}
	}

	// Check if game is over (no moves left)
	private isGameOver(grid: number[][]): boolean {
		for (let i = 0; i < grid.length; i++) {
			const rowArr = grid[i] ?? [];
			for (let j = 0; j < (rowArr?.length ?? 0); j++) {
				if (rowArr[j] === 0) return false;
				if (i < grid.length - 1 && rowArr[j] === (grid[i + 1]?.[j] ?? -1))
					return false;
				if (
					j < (rowArr?.length ?? 0) - 1 &&
					rowArr[j] === (rowArr[j + 1] ?? -1)
				)
					return false;
			}
		}
		return true;
	}

	// Movement logic
	private shiftVertical(
		grid: number[][],
		dir: "up" | "down",
		addScore: (v: number) => void,
	): boolean {
		let moved = false;
		for (let col = 0; col < grid.length; col++) {
			const arr: number[] = [];
			for (let row = 0; row < grid.length; row++) {
				arr.push(grid[row]?.[col] ?? 0);
			}
			const res = this.shiftArray(arr, dir === "up", addScore);
			for (let row = 0; row < grid.length; row++) {
				grid[row] = grid[row] ?? Array(grid.length).fill(0);
				const gridRow = grid[row];
				if (gridRow) {
					gridRow[col] = res[row] ?? 0;
				}
			}
			if (arr.join() !== res.join()) moved = true;
		}
		return moved;
	}
	private shiftHorizontal(
		grid: number[][],
		dir: "left" | "right",
		addScore: (v: number) => void,
	): boolean {
		let moved = false;
		for (let row = 0; row < grid.length; row++) {
			const arr: number[] = (grid[row] ?? []).slice();
			const res = this.shiftArray(arr, dir === "left", addScore);
			grid[row] = res.map((v) => v ?? 0);
			if (arr.join() !== res.join()) moved = true;
		}
		return moved;
	}
	// Shift and merge array for movement
	private shiftArray(
		arr: number[],
		forward: boolean,
		addScore: (v: number) => void,
	): number[] {
		let filtered: number[] = arr.filter(
			(v) => typeof v === "number" && v !== 0,
		);
		if (!forward) filtered = filtered.reverse();
		for (let i = 0; i < filtered.length - 1; i++) {
			if (filtered[i] === filtered[i + 1]) {
				filtered[i] = (filtered[i] ?? 0) * 2;
				addScore(filtered[i] ?? 0);
				filtered.splice(i + 1, 1);
			}
		}
		while (filtered.length < arr.length) filtered.push(0);
		if (!forward) filtered = filtered.reverse();
		return filtered;
	}
}
