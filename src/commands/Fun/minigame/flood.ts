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
	name: "flood",
	description: "Play a game of Flood!",
})
export default class FloodCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { author } = ctx;
		const boardSize = 8;
		const colors = ["🟥", "🟦", "🟧", "🟪", "🟩"];
		const maxTurns = 25;
		let currentTurns = 0;

		// Generate random board
		const board: string[][] = Array(boardSize)
			.fill(0)
			.map(() =>
				Array(boardSize)
					.fill(0)
					.map(() => {
						const randomIndex = Math.floor(Math.random() * colors.length);
						return colors[randomIndex] || "🟥";
					}),
			);

		// Helper functions
		const getBoardDisplay = () => board.map((row) => row.join("")).join("\n");

		const isGameWon = () => {
			const firstColor = board[0]?.[0];
			return board.every((row) => row.every((cell) => cell === firstColor));
		};

		const floodFill = (targetColor: string) => {
			if (board[0]?.[0] === targetColor) return;

			const originalColor = board[0]?.[0];
			const queue: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
			const visited = new Set<string>();

			while (queue.length > 0) {
				const current = queue.shift();
				if (!current) continue;

				const { x, y } = current;
				const key = `${x},${y}`;

				if (
					visited.has(key) ||
					x < 0 ||
					y < 0 ||
					x >= boardSize ||
					y >= boardSize
				)
					continue;
				if (board[y]?.[x] !== originalColor) continue;

				visited.add(key);
				const row = board[y];
				if (row) {
					row[x] = targetColor;
				}

				queue.push(
					{ x: x + 1, y },
					{ x: x - 1, y },
					{ x, y: y + 1 },
					{ x, y: y - 1 },
				);
			}
		};

		const getComponents = (gameOver = false, won = false) => {
			return new Container().addComponents(
				new TextDisplay().setContent(
					`# 🌊 Flood Game\n\n${getBoardDisplay()}\n\n**Turns:** ${currentTurns}/${maxTurns}${gameOver ? (won ? "\n\n🎉 **You Won!**" : "\n\n💔 **Game Over!**") : ""}`,
				),
				new Separator(),
				new TextDisplay().setContent(
					gameOver
						? `**Final Result:** ${won ? `Victory in ${currentTurns} turns!` : `Ran out of turns!`}\n\n-# Requested by ${author.username}`
						: `**Goal:** Fill the entire board with one color!\n**Strategy:** Start from top-left corner and flood connected areas.\n\n-# Requested by ${author.username}`,
				),
			);
		};

		const getButtonRow = (disabled = false) => {
			return new ActionRow<Button>().addComponents(
				...colors.map((color, index) =>
					new Button()
						.setCustomId(`flood_${index}`)
						.setEmoji(color)
						.setStyle(ButtonStyle.Primary)
						.setDisabled(disabled),
				),
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
				i.user.id === author.id && i.customId.startsWith("flood_"),
			idle: 120000, // 2 minutes
		});

		collector.run(/flood_(\d)/, async (interaction: ComponentInteraction) => {
			const colorIndexStr = interaction.customId.split("_")[1];
			if (!colorIndexStr) return;

			const colorIndex = parseInt(colorIndexStr, 10);
			const selectedColor = colors[colorIndex];
			if (!selectedColor) return;

			// Perform flood fill
			floodFill(selectedColor);
			currentTurns++;

			// Check win/lose conditions
			const won = isGameWon();
			const lost = currentTurns >= maxTurns && !won;

			if (won || lost) {
				await interaction.update({
					components: [getComponents(true, won), getButtonRow(true)],
					flags: MessageFlags.IsComponentsV2,
				});
				collector.stop("gameover");
				return;
			}

			await interaction.update({
				components: [getComponents(), getButtonRow()],
				flags: MessageFlags.IsComponentsV2,
			});
		});

		// Collector end: disable buttons
		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				await ctx.editResponse({
					components: [getComponents(true, false), getButtonRow(true)],
				});
			}
		};
	}
}
