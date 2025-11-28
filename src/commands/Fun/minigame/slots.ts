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
	name: "slots",
	description: "Play a game of Slots!",
})
export default class SlotsCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { author } = ctx;
		const slotEmojis = ["🍇", "🍊", "🍋", "🍌"];

		// Game state
		let slot1 = 0;
		let slot2 = 0;
		let slot3 = 0;
		let isSpinning = false;
		let gameOver = false;
		let hasWon = false;

		// Helper functions
		const getSlotEmoji = (
			index: number,
			position: number,
			showResult = false,
		): string => {
			if (showResult || gameOver) {
				return slotEmojis[index] ?? "❓";
			}
			// Show spinning animation
			const spinEmojis = ["🔄", "⚡", "✨", "💫"];
			return spinEmojis[position % spinEmojis.length] ?? "🔄";
		};

		const getNeighborEmoji = (slotIndex: number, offset: number): string => {
			const neighborIndex =
				(slotIndex + offset + slotEmojis.length) % slotEmojis.length;
			return slotEmojis[neighborIndex] ?? "❓";
		};

		const getBoardContent = (showResult = false): string => {
			let board = "```\n-------------------\n";

			// Top row (previous symbols)
			board += `${getNeighborEmoji(slot1, -1)}  :  ${getNeighborEmoji(slot2, -1)}  :  ${getNeighborEmoji(slot3, -1)}\n\n`;

			// Middle row (current symbols)
			board += `${getSlotEmoji(slot1, 0, showResult)}  :  ${getSlotEmoji(slot2, 1, showResult)}  :  ${getSlotEmoji(slot3, 2, showResult)} <\n\n`;

			// Bottom row (next symbols)
			board += `${getNeighborEmoji(slot1, 1)}  :  ${getNeighborEmoji(slot2, 1)}  :  ${getNeighborEmoji(slot3, 1)}\n`;

			board += "-------------------\n";

			if (showResult && gameOver) {
				board += `| : :   ${hasWon ? "WON " : "LOST"}   : : |`;
			}

			return `${board}\`\`\``;
		};

		const checkWin = (): boolean => {
			return slot1 === slot2 && slot1 === slot3;
		};

		const spinSlots = () => {
			slot1 = Math.floor(Math.random() * slotEmojis.length);
			slot2 = Math.floor(Math.random() * slotEmojis.length);
			slot3 = Math.floor(Math.random() * slotEmojis.length);
		};

		const getComponents = () => {
			let statusText: string;
			if (gameOver) {
				if (hasWon) {
					const winEmoji = slotEmojis[slot1];
					statusText = `🎉 **JACKPOT!** You got three ${winEmoji}${winEmoji}${winEmoji}!`;
				} else {
					statusText = `💸 **No luck this time!** Try spinning again!`;
				}
			} else if (isSpinning) {
				statusText = `🎰 **Spinning...** Good luck!`;
			} else {
				statusText = `🎲 **Ready to spin!** Click the button to try your luck!`;
			}

			return new Container().addComponents(
				new TextDisplay().setContent(
					`# 🎰 Slot Machine\n\n${getBoardContent(gameOver)}\n\n**Symbols:** ${slotEmojis.join(" ")}`,
				),
				new Separator(),
				new TextDisplay().setContent(
					`${statusText}\n\n**How it works:**\n- Match 3 symbols to win!\n- All symbols have equal chance\n\n-# Requested by ${author.username}`,
				),
			);
		};

		const getSpinButton = (disabled = false) => {
			return [
				new ActionRow<Button>().addComponents(
					new Button()
						.setCustomId("slots_spin")
						.setEmoji("🎰")
						.setLabel(gameOver ? "Spin Again" : "Spin")
						.setStyle(ButtonStyle.Primary)
						.setDisabled(disabled || isSpinning),
					new Button()
						.setCustomId("slots_stop")
						.setEmoji("🛑")
						.setLabel("Stop")
						.setStyle(ButtonStyle.Danger)
						.setDisabled(disabled),
				),
			];
		};

		// Send initial message
		const message = await ctx.write(
			{
				components: [getComponents(), ...getSpinButton()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				i.user.id === author.id && i.customId.startsWith("slots_"),
			idle: 300000, // 5 minutes
		});

		collector.run(/slots_(.+)/, async (interaction: ComponentInteraction) => {
			const action = interaction.customId.split("_")[1];

			if (action === "stop") {
				collector.stop("stopped");
				return;
			}

			if (action === "spin") {
				isSpinning = true;
				gameOver = false;
				hasWon = false;

				// Update to show spinning
				await interaction.update({
					components: [getComponents(), ...getSpinButton(true)],
					flags: MessageFlags.IsComponentsV2,
				});

				// First spin
				spinSlots();
				await new Promise((resolve) => setTimeout(resolve, 1000));

				await ctx.editResponse({
					components: [getComponents(), ...getSpinButton(true)],
				});

				// Second spin for more suspense
				spinSlots();
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Final result
				spinSlots();
				isSpinning = false;
				gameOver = true;
				hasWon = checkWin();

				await ctx.editResponse({
					components: [getComponents(), ...getSpinButton()],
				});

				// Show result for 2 seconds then allow new spin
				setTimeout(async () => {
					try {
						gameOver = false;
						await ctx.editResponse({
							components: [getComponents(), ...getSpinButton()],
						});
					} catch {
						// Collector might have ended
					}
				}, 3000);
			}
		});

		// Collector end: disable buttons
		collector.stop = async (reason: string) => {
			if (reason === "idle" || reason === "stopped") {
				await ctx.editResponse({
					components: [getComponents(), ...getSpinButton(true)],
				});
			}
		};
	}
}
