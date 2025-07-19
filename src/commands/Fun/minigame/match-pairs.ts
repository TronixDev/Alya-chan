import {
	Declare,
	type CommandContext,
	SubCommand,
	Container,
	TextDisplay,
	Separator,
	ActionRow,
	Button,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";

@Declare({
	name: "match-pairs",
	description: "Play a game of Match Pairs!",
})
export default class MatchPairsCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { author } = ctx;
		const emojis = [
			"🍉",
			"🍇",
			"🍊",
			"🍋",
			"🥭",
			"🍎",
			"🍏",
			"🥝",
			"🥥",
			"🍓",
			"🍒",
			"🫐",
		];

		// Select 12 emojis and create pairs + add a joker
		const selectedEmojis = this.shuffleArray([...emojis]).slice(0, 12);
		const gameEmojis = [...selectedEmojis, ...selectedEmojis, "🃏"]; // 24 + 1 joker
		this.shuffleArray(gameEmojis);

		// Game state
		const gridSize = 5; // 5x5 grid
		let tilesTurned = 0;
		let remainingPairs = 12;
		let selectedTile: { x: number; y: number; id: number } | null = null;
		let gameOver = false;
		let won = false;

		// Track revealed tiles and matched pairs
		const revealed = Array(gridSize)
			.fill(null)
			.map(() => Array(gridSize).fill(false));
		const matched = Array(gridSize)
			.fill(null)
			.map(() => Array(gridSize).fill(false));

		// Helper functions
		const getTileEmoji = (x: number, y: number) => {
			const index = y * gridSize + x;
			return gameEmojis[index] ?? "🔲";
		};

		const getTileId = (x: number, y: number) => y * gridSize + x;

		const getPairPositions = (emoji: string) => {
			const positions: { x: number; y: number; id: number }[] = [];
			for (let y = 0; y < gridSize; y++) {
				for (let x = 0; x < gridSize; x++) {
					const index = y * gridSize + x;
					if (gameEmojis[index] === emoji) {
						positions.push({ x, y, id: index });
					}
				}
			}
			return positions;
		};

		const getComponents = () => {
			let statusText;
			if (gameOver) {
				if (won) {
					statusText = `🎉 **You won!** You turned a total of \`${tilesTurned}\` tiles.`;
				} else {
					statusText = `⏰ **Game Over!** You turned a total of \`${tilesTurned}\` tiles.`;
				}
			} else {
				statusText = `🎯 **Find the matching pairs!**\n**Tiles Turned:** ${tilesTurned} | **Pairs Left:** ${remainingPairs}`;
			}

			return new Container().addComponents(
				new TextDisplay().setContent(
					`# 🎯 Match Pairs Game\n\n**Click tiles to find matching emojis!**\n\n**Progress:** ${12 - remainingPairs}/12 pairs found`,
				),
				new Separator(),
				new TextDisplay().setContent(
					`${statusText}\n\n**Special:** 🃏 Joker matches with any emoji!\n\n-# Requested by ${author.username}`,
				),
			);
		};

		const getTileButtons = (disabled = false) => {
			const buttons: ActionRow<Button>[] = [];

			for (let y = 0; y < gridSize; y++) {
				const buttonRow = new ActionRow<Button>();
				for (let x = 0; x < gridSize; x++) {
					const isRevealed = revealed[y]![x];
					const isMatched = matched[y]![x];
					const tileEmoji = isRevealed || isMatched ? getTileEmoji(x, y) : "🔲";

					let buttonStyle = ButtonStyle.Secondary;
					if (isMatched) {
						buttonStyle = ButtonStyle.Success;
					} else if (isRevealed) {
						buttonStyle = ButtonStyle.Primary;
					}

					buttonRow.addComponents(
						new Button()
							.setCustomId(`pairs_${x}_${y}`)
							.setEmoji(tileEmoji)
							.setStyle(buttonStyle)
							.setDisabled(disabled || isMatched || isRevealed || gameOver),
					);
				}
				buttons.push(buttonRow);
			}

			return buttons;
		};

		// Send initial message
		const message = (await ctx.write(
			{
				components: [getComponents(), ...getTileButtons()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		)) as any;

		// Collector for tile clicks
		const collector = message.createComponentCollector({
			filter: (i: any) =>
				i.user.id === author.id && i.customId.startsWith("pairs_"),
			idle: 300000, // 5 minutes
		});

		collector.run(/pairs_(\d)_(\d)/, async (interaction: any) => {
			if (gameOver) return;

			const x = parseInt(interaction.customId.split("_")[1]!);
			const y = parseInt(interaction.customId.split("_")[2]!);
			const id = getTileId(x, y);

			// Prevent clicking already revealed/matched tiles
			if (revealed[y]![x] || matched[y]![x]) return;

			const emoji = getTileEmoji(x, y);
			tilesTurned++;

			if (!selectedTile) {
				// First tile selection
				selectedTile = { x, y, id };
				revealed[y]![x] = true;
			} else if (selectedTile.id === id) {
				// Deselect same tile
				selectedTile = null;
				revealed[y]![x] = false;
			} else {
				// Second tile selection
				const selectedEmoji = getTileEmoji(selectedTile.x, selectedTile.y);
				revealed[y]![x] = true;

				const isMatch =
					emoji === selectedEmoji || selectedEmoji === "🃏" || emoji === "🃏";

				await interaction.update({
					components: [getComponents(), ...getTileButtons()],
					flags: MessageFlags.IsComponentsV2,
				});

				// Wait a moment to show both tiles
				await new Promise((resolve) => setTimeout(resolve, 1500));

				if (isMatch) {
					// Mark as matched
					matched[selectedTile.y]![selectedTile.x] = true;
					matched[y]![x] = true;

					// Handle joker matching
					if (selectedEmoji === "🃏" || emoji === "🃏") {
						const targetEmoji = emoji === "🃏" ? selectedEmoji : emoji;
						const pairs = getPairPositions(targetEmoji).filter(
							(p) => p.id !== (emoji === "🃏" ? id : selectedTile!.id),
						);

						if (pairs.length > 0) {
							const pair = pairs[0]!;
							matched[pair.y]![pair.x] = true;
						}
					}

					remainingPairs--;

					if (remainingPairs === 0) {
						gameOver = true;
						won = true;
						collector.stop("won");
					}
				} else {
					// Hide tiles again
					revealed[selectedTile.y]![selectedTile.x] = false;
					revealed[y]![x] = false;
				}

				selectedTile = null;
			}

			await interaction.update({
				components: [getComponents(), ...getTileButtons(gameOver)],
				flags: MessageFlags.IsComponentsV2,
			});
		});

		// Collector end: disable buttons
		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				gameOver = true;
				await ctx.editResponse({
					components: [getComponents(), ...getTileButtons(true)],
				});
			}
		};
	}

	private shuffleArray<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
		}
		return shuffled;
	}
}
