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

interface Position {
	x: number;
	y: number;
}

@Declare({
	name: "snake",
	description: "Play a game of Snake!",
})
export default class SnakeCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { author } = ctx;
		const WIDTH = 15;
		const HEIGHT = 10;

		// Game state
		const snake: Position[] = [{ x: 5, y: 5 }];
		let food: Position = { x: 1, y: 1 };
		let direction: "up" | "down" | "left" | "right" | null = null;
		let score = 0;
		let gameOver = false;
		let won = false;

		// Helper functions
		const isSnake = (pos: Position): Position | false => {
			return (
				snake.find((segment) => segment.x === pos.x && segment.y === pos.y) ||
				false
			);
		};

		const updateFoodLocation = () => {
			let newPos: Position;
			do {
				newPos = {
					x: Math.floor(Math.random() * WIDTH),
					y: Math.floor(Math.random() * HEIGHT),
				};
			} while (isSnake(newPos));

			food = newPos;
		};

		const getBoardContent = (isDead = false): string => {
			let board = "";

			for (let y = 0; y < HEIGHT; y++) {
				for (let x = 0; x < WIDTH; x++) {
					const pos = { x, y };

					// Check if this position is food
					if (x === food.x && y === food.y) {
						board += "🍎";
						continue;
					}

					// Check if this position is snake
					const snakeSegment = isSnake(pos);
					if (snakeSegment) {
						const segmentIndex = snake.indexOf(snakeSegment);
						if (segmentIndex === 0) {
							// Head - show skull if dead, normal head if alive
							board += isDead ? "💀" : "🟢";
						} else if (segmentIndex === snake.length - 1) {
							// Tail
							board += "🟢";
						} else {
							// Body
							board += "🟩";
						}
					} else {
						// Empty space
						board += "⬛";
					}
				}
				board += "\n";
			}

			return board;
		};

		const moveSnake = (): boolean => {
			if (!direction) return true; // No movement yet

			const head = snake[0];
			if (!head) return false; // Snake is empty
			let newHead: Position;

			switch (direction) {
				case "up":
					newHead = { x: head.x, y: head.y - 1 };
					break;
				case "down":
					newHead = { x: head.x, y: head.y + 1 };
					break;
				case "left":
					newHead = { x: head.x - 1, y: head.y };
					break;
				case "right":
					newHead = { x: head.x + 1, y: head.y };
					break;
			}

			// Check wall collision
			if (
				newHead.x < 0 ||
				newHead.x >= WIDTH ||
				newHead.y < 0 ||
				newHead.y >= HEIGHT
			) {
				return false; // Hit wall
			}

			// Check self collision
			if (isSnake(newHead)) {
				return false; // Hit self
			}

			// Add new head
			snake.unshift(newHead);

			// Check if food eaten
			if (newHead.x === food.x && newHead.y === food.y) {
				score++;
				updateFoodLocation();

				// Check win condition (filled entire board)
				if (snake.length >= WIDTH * HEIGHT) {
					won = true;
					return false;
				}
			} else {
				// Remove tail if no food eaten
				snake.pop();
			}

			return true;
		};

		const getComponents = () => {
			let statusText: string;
			if (gameOver) {
				if (won) {
					statusText = `🎉 **Perfect Game!** You filled the entire board!`;
				} else {
					statusText = `💀 **Game Over!** Final score: ${score}`;
				}
			} else {
				statusText = `🐍 **Use the arrow buttons to move!**\n**Score:** ${score} | **Length:** ${snake.length}`;
			}

			return new Container().addComponents(
				new TextDisplay().setContent(
					`# 🐍 Snake Game\n\n\`\`\`\n${getBoardContent(gameOver && !won)}\n\`\`\``,
				),
				new Separator(),
				new TextDisplay().setContent(
					`${statusText}\n\n**Rules:** Eat 🍎 to grow, avoid walls and yourself!\n\n-# Requested by ${author.username}`,
				),
			);
		};

		const getControlButtons = (disabled = false) => {
			const row1 = new ActionRow<Button>().addComponents(
				new Button()
					.setCustomId("snake_disabled1")
					.setLabel("⬜")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true),
				new Button()
					.setCustomId("snake_up")
					.setEmoji("⬆️")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled || gameOver),
				new Button()
					.setCustomId("snake_disabled2")
					.setLabel("⬜")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true),
				new Button()
					.setCustomId("snake_stop")
					.setEmoji("🛑")
					.setLabel("Stop")
					.setStyle(ButtonStyle.Danger)
					.setDisabled(disabled),
			);

			const row2 = new ActionRow<Button>().addComponents(
				new Button()
					.setCustomId("snake_left")
					.setEmoji("⬅️")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled || gameOver),
				new Button()
					.setCustomId("snake_down")
					.setEmoji("⬇️")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled || gameOver),
				new Button()
					.setCustomId("snake_right")
					.setEmoji("➡️")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disabled || gameOver),
			);

			return [row1, row2];
		};

		// Initialize food location
		updateFoodLocation();

		// Send initial message
		const message = await ctx.write(
			{
				components: [getComponents(), ...getControlButtons()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				i.user.id === author.id && i.customId.startsWith("snake_"),
			idle: 120000, // 2 minutes
		});

		collector.run(/snake_(.+)/, async (interaction: ComponentInteraction) => {
			const action = interaction.customId.split("_")[1];

			if (action === "stop") {
				gameOver = true;
				collector.stop("stopped");
				await interaction.update({
					components: [getComponents(), ...getControlButtons(true)],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			if (action && ["up", "down", "left", "right"].includes(action)) {
				direction = action as "up" | "down" | "left" | "right";

				// Move snake immediately
				const alive = moveSnake();

				if (!alive) {
					gameOver = true;
					collector.stop("gameover");
				}

				await interaction.update({
					components: [getComponents(), ...getControlButtons(gameOver)],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		});

		// Collector end: disable buttons
		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				gameOver = true;
				await ctx.editResponse({
					components: [getComponents(), ...getControlButtons(true)],
				});
			}
		};
	}
}
