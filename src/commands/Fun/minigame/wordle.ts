import {
	ActionRow,
	Button,
	type CommandContext,
	type ComponentInteraction,
	Container,
	createStringOption,
	Declare,
	Options,
	Separator,
	SubCommand,
	TextDisplay,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";

const options = {
	difficulty: createStringOption({
		description: "Select the difficulty level",
		choices: [
			{ name: "Easy (4 letters)", value: "4" },
			{ name: "Normal (5 letters)", value: "5" },
			{ name: "Hard (6 letters)", value: "6" },
		],
		required: false,
	}),
};

// Word lists for different difficulties
const wordLists = {
	4: [
		"WORD",
		"PLAY",
		"GAME",
		"CODE",
		"TYPE",
		"FAST",
		"COOL",
		"NICE",
		"TEAM",
		"HELP",
		"TIME",
		"LOVE",
		"LIFE",
		"BOOK",
		"MAKE",
		"TAKE",
		"COME",
		"WORK",
		"EASY",
		"HARD",
	],
	5: [
		"WORLD",
		"PLANT",
		"GHOST",
		"THINK",
		"LIGHT",
		"HOUSE",
		"PHONE",
		"MONEY",
		"MUSIC",
		"POINT",
		"POWER",
		"QUICK",
		"RIGHT",
		"SMALL",
		"START",
		"STUDY",
		"TRAIN",
		"TRUTH",
		"WATER",
		"YOUNG",
	],
	6: [
		"BRIDGE",
		"CASTLE",
		"CHANGE",
		"CHOICE",
		"CHURCH",
		"CIRCLE",
		"COFFEE",
		"COUPLE",
		"DANGER",
		"DOLLAR",
		"DOUBLE",
		"DRAGON",
		"EFFECT",
		"EFFORT",
		"ENERGY",
		"ENGINE",
		"EUROPE",
		"FAMILY",
		"FINGER",
		"FLIGHT",
	],
};

@Declare({
	name: "wordle",
	description: "Play a game of Wordle!",
})
@Options(options)
export default class WordleCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>) {
		const { author } = ctx;
		const difficulty = parseInt(ctx.options.difficulty || "5", 10);

		// Game state
		let gamePhase: "playing" | "ended" = "playing";
		let targetWord = "";
		let guesses: string[] = [];
		let currentGuess = "";
		const maxGuesses = 6;
		let gameResult: "win" | "lose" | null = null;

		// Initialize game
		const wordList = wordLists[difficulty as keyof typeof wordLists];
		const randomIndex = Math.floor(Math.random() * wordList.length);
		const selectedWord = wordList[randomIndex];
		if (!selectedWord) {
			return ctx.editOrReply({
				content: "❌ Failed to select a word for the game!",
			});
		}
		targetWord = selectedWord;

		// Helper functions
		const getLetterStatus = (
			letter: string,
			position: number,
		): "correct" | "wrong-position" | "wrong" => {
			if (targetWord[position] === letter) {
				return "correct";
			} else if (targetWord.includes(letter)) {
				return "wrong-position";
			} else {
				return "wrong";
			}
		};

		const formatGuessDisplay = (guess: string): string => {
			return guess
				.split("")
				.map((letter, index) => {
					const status = getLetterStatus(letter, index);
					switch (status) {
						case "correct":
							return `🟩${letter}`;
						case "wrong-position":
							return `🟨${letter}`;
						default:
							return `⬛${letter}`;
					}
				})
				.join(" ");
		};

		const getGuessesDisplay = (): string => {
			let display = "";

			// Show completed guesses
			for (let i = 0; i < guesses.length; i++) {
				const guess = guesses[i];
				if (guess) {
					display += `**${i + 1}.** ${formatGuessDisplay(guess)}\n`;
				}
			}

			// Show current guess being typed
			if (
				gamePhase === "playing" &&
				currentGuess &&
				guesses.length < maxGuesses
			) {
				const paddedGuess = currentGuess.padEnd(difficulty, "⬜");
				display += `**${guesses.length + 1}.** ${paddedGuess.split("").join(" ")} ⏳\n`;
			}

			// Show remaining empty slots
			const remainingSlots =
				maxGuesses -
				guesses.length -
				(currentGuess && gamePhase === "playing" ? 1 : 0);
			for (let i = 0; i < remainingSlots; i++) {
				const emptySlot = "⬜".repeat(difficulty);
				display += `**${guesses.length + (currentGuess && gamePhase === "playing" ? 1 : 0) + i + 1}.** ${emptySlot.split("").join(" ")}\n`;
			}

			return display;
		};

		const getStatusMessage = (): string => {
			if (gamePhase === "ended") {
				if (gameResult === "win") {
					return `🎉 **Congratulations! You guessed "${targetWord}" correctly!**`;
				} else {
					return `😔 **Game Over! The word was "${targetWord}".** Better luck next time!`;
				}
			} else {
				return `🎯 **Guess the ${difficulty}-letter word!** (${guesses.length}/${maxGuesses} attempts used)`;
			}
		};

		const getComponents = () => {
			return new Container().addComponents(
				new TextDisplay().setContent(
					`# 🎮 Wordle Game\n\n**Player:** ${author.username}\n**Difficulty:** ${difficulty} letters\n**Target:** ${"❓".repeat(difficulty)}`,
				),
				new Separator(),
				new TextDisplay().setContent(
					`**Guesses:**\n${getGuessesDisplay()}\n**Status:** ${getStatusMessage()}\n\n**Legend:** 🟩 = Correct, 🟨 = Wrong Position, ⬛ = Wrong Letter\n\n-# Type your ${difficulty}-letter guess or use buttons!`,
				),
			);
		};

		const getGameButtons = (disabled = false) => {
			if (gamePhase === "ended") {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("wordle_new")
							.setEmoji("🔄")
							.setLabel("New Game")
							.setStyle(ButtonStyle.Success)
							.setDisabled(disabled),
					),
				];
			} else {
				const buttons = [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("wordle_submit")
							.setEmoji("✅")
							.setLabel(`Submit Guess (${currentGuess.length}/${difficulty})`)
							.setStyle(ButtonStyle.Primary)
							.setDisabled(disabled || currentGuess.length !== difficulty),
						new Button()
							.setCustomId("wordle_clear")
							.setEmoji("🗑️")
							.setLabel("Clear")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(disabled || currentGuess.length === 0),
					),
				];

				// Add alphabet buttons for easy input
				const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
				const row1 = new ActionRow<Button>();
				const row2 = new ActionRow<Button>();
				const row3 = new ActionRow<Button>();

				for (let i = 0; i < alphabet.length; i++) {
					const letter = alphabet[i];
					if (!letter) continue;

					const button = new Button()
						.setCustomId(`wordle_letter_${letter}`)
						.setLabel(letter)
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(disabled || currentGuess.length >= difficulty);

					if (i < 9) row1.addComponents(button);
					else if (i < 18) row2.addComponents(button);
					else row3.addComponents(button);
				}

				buttons.push(row1, row2, row3);
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
				i.user.id === author.id && i.customId.startsWith("wordle_"),
			idle: 300000, // 5 minutes
		});

		// ...existing code...

		collector.run(/wordle_(.+)/, async (interaction: ComponentInteraction) => {
			const actionParts = interaction.customId.split("_");
			const action = actionParts[1];

			if (action === "new") {
				// Reset game
				gamePhase = "playing";
				const newRandomIndex = Math.floor(Math.random() * wordList.length);
				const newSelectedWord = wordList[newRandomIndex];
				if (newSelectedWord) {
					targetWord = newSelectedWord;
				}
				guesses = [];
				currentGuess = "";
				gameResult = null;

				await interaction.update({
					components: [getComponents(), ...getGameButtons()],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			if (action === "submit") {
				if (currentGuess.length === difficulty) {
					guesses.push(currentGuess);
					const wasCorrect = currentGuess === targetWord;
					currentGuess = "";

					if (wasCorrect) {
						gamePhase = "ended";
						gameResult = "win";
					} else if (guesses.length >= maxGuesses) {
						gamePhase = "ended";
						gameResult = "lose";
					}
				}

				await interaction.update({
					components: [getComponents(), ...getGameButtons()],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			if (action === "clear") {
				currentGuess = "";
				await interaction.update({
					components: [getComponents(), ...getGameButtons()],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			if (action === "letter") {
				const letter = actionParts[2];
				if (letter && currentGuess.length < difficulty) {
					currentGuess += letter;
				}

				await interaction.update({
					components: [getComponents(), ...getGameButtons()],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}
		});

		// Collector end: disable buttons
		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				gamePhase = "ended";
				try {
					await ctx.editResponse({
						components: [getComponents(), ...getGameButtons(true)],
					});
				} catch (error) {
					console.error("Error updating message on collector end:", error);
				}
			}
		};
	}
}
