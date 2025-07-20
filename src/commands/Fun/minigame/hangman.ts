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

@Declare({
	name: "hangman",
	description: "Play a game of Hangman!",
})
export default class HangmanCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { author } = ctx;

		// Word categories and words
		const words = {
			programming: [
				"JAVASCRIPT",
				"TYPESCRIPT",
				"PROGRAMMING",
				"COMPUTER",
				"KEYBOARD",
				"MONITOR",
				"DISCORD",
				"GAMING",
			],
			animals: [
				"ELEPHANT",
				"GIRAFFE",
				"PENGUIN",
				"DOLPHIN",
				"BUTTERFLY",
				"CHEETAH",
				"KANGAROO",
				"OCTOPUS",
			],
			colors: [
				"CRIMSON",
				"TURQUOISE",
				"MAGENTA",
				"EMERALD",
				"VIOLET",
				"AMBER",
				"AZURE",
				"SCARLET",
			],
			food: [
				"HAMBURGER",
				"CHOCOLATE",
				"SANDWICH",
				"SPAGHETTI",
				"PANCAKES",
				"STRAWBERRY",
				"PINEAPPLE",
				"BROCCOLI",
			],
		};

		const themes = Object.keys(words) as (keyof typeof words)[];
		const randomThemeIndex = Math.floor(Math.random() * themes.length);
		const selectedTheme = themes[randomThemeIndex] || "programming";
		const themeWords = words[selectedTheme];
		const randomWordIndex = Math.floor(Math.random() * themeWords.length);
		const targetWord = themeWords[randomWordIndex] || "JAVASCRIPT";

		// Game state
		const guessedLetters: string[] = [];
		let wrongGuesses = 0;
		const maxWrongGuesses = 6;
		let gameOver = false;
		let won = false;
		let currentPage = 0; // 0 for A-L, 1 for M-Z

		// Hangman stages with emojis
		const hangmanStages = [
			"```\n|‾‾‾‾‾‾| \n|        \n|        \n|        \n|        \n|        \n|        \n|__________\n```",
			"```\n|‾‾‾‾‾‾| \n|      🎩 \n|        \n|        \n|        \n|        \n|        \n|__________\n```",
			"```\n|‾‾‾‾‾‾| \n|      🎩 \n|      😟 \n|        \n|        \n|        \n|        \n|__________\n```",
			"```\n|‾‾‾‾‾‾| \n|      🎩 \n|      😟 \n|      👕 \n|        \n|        \n|        \n|__________\n```",
			"```\n|‾‾‾‾‾‾| \n|      🎩 \n|      😟 \n|      👕 \n|      🩳 \n|        \n|        \n|__________\n```",
			"```\n|‾‾‾‾‾‾| \n|      🎩 \n|      😟 \n|      👕 \n|      🩳 \n|     👞  \n|        \n|__________\n```",
			"```\n|‾‾‾‾‾‾| \n|      🎩 \n|      😟 \n|      👕 \n|      🩳 \n|     👞👞\n|        \n|__________\n```",
		];

		// Helper functions
		const getAlphaEmoji = (letter: string) => {
			const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			const emojiAlphabet = "🇦🇧🇨🇩🇪🇫🇬🇭🇮🇯🇰🇱🇲🇳🇴🇵🇶🇷🇸🇹🇺🇻🇼🇽🇾🇿";
			const index = alphabet.indexOf(letter.toUpperCase());
			return index !== -1 ? emojiAlphabet[index] : letter;
		};

		const getWordDisplay = () => {
			return targetWord
				.split("")
				.map((letter) => {
					if (letter === " ") return "⬜";
					return guessedLetters.includes(letter) ? getAlphaEmoji(letter) : "🔵";
				})
				.join(" ");
		};

		const checkWin = () => {
			return targetWord
				.split("")
				.every((letter) => letter === " " || guessedLetters.includes(letter));
		};

		const getComponents = () => {
			let statusText: string;
			if (gameOver) {
				if (won) {
					statusText = `🎉 **You won!** The word was **${targetWord}**.`;
				} else {
					statusText = `💀 **You lost!** The word was **${targetWord}**.`;
				}
			} else {
				statusText = `🎯 **Keep guessing!** Wrong: ${wrongGuesses}/${maxWrongGuesses}`;
			}

			const guessedText =
				guessedLetters.length > 0
					? `**Letters Guessed:** \`${guessedLetters.join(", ")}\``
					: "";

			return new Container().addComponents(
				new TextDisplay().setContent(
					`# 🎩 Hangman Game\n\n${hangmanStages[wrongGuesses]}\n\n**Theme:** ${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}\n**Word:** ${getWordDisplay()}\n\n${statusText}`,
				),
				new Separator(),
				new TextDisplay().setContent(
					`${guessedText}\n\n-# Requested by ${author.username}`,
				),
			);
		};

		const getLetterButtons = (disabled = false) => {
			const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			const buttons: ActionRow<Button>[] = [];

			// First page: A-L (12 letters)
			if (currentPage === 0) {
				for (let row = 0; row < 3; row++) {
					const buttonRow = new ActionRow<Button>();
					for (let col = 0; col < 4; col++) {
						const letterIndex = row * 4 + col;
						if (letterIndex < 12) {
							const letter = alphabet[letterIndex];
							if (!letter) continue;
							const isGuessed = guessedLetters.includes(letter);

							buttonRow.addComponents(
								new Button()
									.setCustomId(`hangman_${letter}`)
									.setLabel(letter)
									.setStyle(ButtonStyle.Primary)
									.setDisabled(disabled || isGuessed || gameOver),
							);
						}
					}
					buttons.push(buttonRow);
				}
			} else {
				// Second page: M-Z (14 letters)
				for (let row = 0; row < 4; row++) {
					const buttonRow = new ActionRow<Button>();
					for (let col = 0; col < 4; col++) {
						const letterIndex = 12 + row * 4 + col;
						if (letterIndex < 26) {
							const letter = alphabet[letterIndex];
							if (!letter) continue;
							const isGuessed = guessedLetters.includes(letter);

							buttonRow.addComponents(
								new Button()
									.setCustomId(`hangman_${letter}`)
									.setLabel(letter)
									.setStyle(ButtonStyle.Primary)
									.setDisabled(disabled || isGuessed || gameOver),
							);
						}
					}
					if (buttonRow.components.length > 0) {
						buttons.push(buttonRow);
					}
				}
			}

			// Navigation and control buttons
			const controlRow = new ActionRow<Button>().addComponents(
				new Button()
					.setCustomId(`hangman_page_${currentPage === 0 ? 1 : 0}`)
					.setEmoji(currentPage === 0 ? "➡️" : "⬅️")
					.setLabel(currentPage === 0 ? "M-Z" : "A-L")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(disabled),
				new Button()
					.setCustomId("hangman_stop")
					.setEmoji("🛑")
					.setLabel("Stop")
					.setStyle(ButtonStyle.Danger)
					.setDisabled(disabled),
			);

			buttons.push(controlRow);
			return buttons;
		};

		// Send initial message
		const message = await ctx.write(
			{
				components: [getComponents(), ...getLetterButtons()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				i.user.id === author.id && i.customId.startsWith("hangman_"),
			idle: 180000, // 3 minutes
		});

		collector.run(/hangman_(.+)/, async (interaction: ComponentInteraction) => {
			const action = interaction.customId.split("_")[1];
			if (!action) return;

			if (action === "stop") {
				gameOver = true;
				collector.stop("stopped");
				return;
			}

			if (action === "page") {
				const pageStr = interaction.customId.split("_")[2];
				if (pageStr) {
					currentPage = parseInt(pageStr);
				}
				await interaction.update({
					components: [getComponents(), ...getLetterButtons()],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			// Letter guess
			const letter = action;
			if (guessedLetters.includes(letter) || gameOver) return;

			guessedLetters.push(letter);

			// Check if letter is in word
			if (!targetWord.includes(letter)) {
				wrongGuesses++;
			}

			// Check win/lose conditions
			if (wrongGuesses >= maxWrongGuesses) {
				gameOver = true;
				won = false;
			} else if (checkWin()) {
				gameOver = true;
				won = true;
			}

			await interaction.update({
				components: [getComponents(), ...getLetterButtons(gameOver)],
				flags: MessageFlags.IsComponentsV2,
			});

			if (gameOver) {
				collector.stop("gameover");
			}
		});

		// Collector end: disable buttons
		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				gameOver = true;
				await ctx.editResponse({
					components: [getComponents(), ...getLetterButtons(true)],
				});
			}
		};
	}
}
