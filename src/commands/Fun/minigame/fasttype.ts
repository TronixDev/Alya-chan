import {
	ActionRow,
	Button,
	type CommandContext,
	type ComponentInteraction,
	Container,
	createStringOption,
	Declare,
	Label,
	Modal,
	type ModalSubmitInteraction,
	Options,
	Separator,
	SubCommand,
	TextDisplay,
	TextInput,
} from "seyfert";
import { ButtonStyle, MessageFlags, TextInputStyle } from "seyfert/lib/types";

const options = {
	difficulty: createStringOption({
		description: "Select the difficulty level",
		choices: [
			{ name: "Easy", value: "easy" },
			{ name: "Medium", value: "medium" },
			{ name: "Hard", value: "hard" },
		],
		required: false,
	}),
};

// Sentences for different difficulties
const sentences = {
	easy: [
		"The quick brown fox jumps over the lazy dog.",
		"A journey of a thousand miles begins with a single step.",
		"To be or not to be, that is the question.",
		"All that glitters is not gold.",
		"Actions speak louder than words.",
		"The early bird catches the worm.",
		"Practice makes perfect.",
		"Time heals all wounds.",
		"Better late than never.",
		"Knowledge is power.",
	],
	medium: [
		"Programming is the art of telling another human being what one wants the computer to do.",
		"The computer was born to solve problems that did not exist before.",
		"Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
		"First, solve the problem. Then, write the code.",
		"Experience is the name everyone gives to their mistakes.",
		"The best way to get a project done faster is to start sooner.",
		"Code is like humor. When you have to explain it, it's bad.",
		"Simplicity is the ultimate sophistication.",
		"Make it work, make it right, make it fast.",
		"Programs must be written for people to read, and only incidentally for machines to execute.",
	],
	hard: [
		"In computer science, we stand on each other's feet and tell each other where we are going wrong, but we are all heading in the same direction.",
		"The most important single aspect of software development is to be clear about what you are trying to build and what problem you are trying to solve.",
		"Software engineering is a discipline whose aim is the production of fault-free software, delivered on time and within budget, that satisfies the user's needs.",
		"The best programmers are not marginally better than merely good ones. They are an order-of-magnitude better, measured by whatever standard: conceptual creativity, speed, ingenuity of design, or problem-solving ability.",
		"A language that doesn't affect the way you think about programming is not worth knowing, and conversely, learning a new programming language will affect the way you think about programming.",
		"The computing scientist's main challenge is not to get confused by the complexities of his own making, and to not lose track of what he is doing.",
		"We should forget about small efficiencies, say about 97% of the time: premature optimization is the root of all evil. Yet we should not pass up our opportunities in that critical 3%.",
		"The art of programming is the art of organizing complexity, of mastering multitude and avoiding its bastard chaos as effectively as possible.",
		"Testing can only prove the presence of bugs, not their absence, and a program which has not been specified cannot be incorrect, it can only be surprising.",
		"The real problem is that programmers have spent far too much time worrying about efficiency in the wrong places and at the wrong times; premature optimization is the root of all evil.",
	],
};

@Declare({
	name: "fasttype",
	description: "Test your typing speed with Fast Type!",
})
@Options(options)
export default class FastTypeCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>) {
		const { author } = ctx;
		const difficulty = ctx.options.difficulty || "medium";

		// Game state
		let gamePhase: "countdown" | "playing" | "ended" = "countdown";
		let targetSentence = "";
		let userInput = "";
		let startTime = 0;
		let endTime = 0;
		const timeLimit = 60000; // 60 seconds
		let countdownInterval: NodeJS.Timeout | null = null;
		let gameTimeout: NodeJS.Timeout | null = null;
		let countdown = 3;

		// Initialize game
		const sentenceList = sentences[difficulty as keyof typeof sentences];
		const randomIndex = Math.floor(Math.random() * sentenceList.length);
		targetSentence = sentenceList[randomIndex] || "Default sentence";

		// Helper functions
		const calculateWPM = (text: string, timeInMs: number): number => {
			const words = text.trim().split(/\s+/).length;
			const minutes = timeInMs / 60000;
			return Math.round(words / minutes);
		};

		const calculateAccuracy = (original: string, typed: string): number => {
			if (typed.length === 0) return 0;
			let correct = 0;
			const minLength = Math.min(original.length, typed.length);

			for (let i = 0; i < minLength; i++) {
				if (original[i] === typed[i]) {
					correct++;
				}
			}

			return Math.round((correct / original.length) * 100);
		};

		const getDisplayText = (): string => {
			if (!userInput) return targetSentence;

			let result = "";
			for (let i = 0; i < targetSentence.length; i++) {
				if (i < userInput.length) {
					if (userInput[i] === targetSentence[i]) {
						result += `~~${targetSentence[i]}~~`; // Correct (strikethrough)
					} else {
						result += `**${targetSentence[i]}**`; // Incorrect (bold)
					}
				} else {
					result += targetSentence[i]; // Not typed yet
				}
			}
			return result;
		};

		const getStatusMessage = (): string => {
			if (gamePhase === "countdown") {
				return `🕐 **Get ready! Starting in ${countdown}...**`;
			} else if (gamePhase === "playing") {
				const elapsed = Date.now() - startTime;
				const remaining = Math.max(0, Math.ceil((timeLimit - elapsed) / 1000));
				return `⏱️ **Time remaining: ${remaining}s** | **Progress: ${userInput.length}/${targetSentence.length}**`;
			} else {
				const timeTaken = endTime - startTime;
				const wpm = calculateWPM(userInput, timeTaken);
				const accuracy = calculateAccuracy(targetSentence, userInput);
				const isCompleted = userInput === targetSentence;

				if (isCompleted) {
					return `🎉 **Completed!** Time: ${(timeTaken / 1000).toFixed(1)}s | WPM: ${wpm} | Accuracy: ${accuracy}%`;
				} else {
					return `⏰ **Time's up!** WPM: ${wpm} | Accuracy: ${accuracy}% | Completed: ${Math.round((userInput.length / targetSentence.length) * 100)}%`;
				}
			}
		};

		const getComponents = () => {
			return new Container().addComponents(
				new TextDisplay().setContent(
					`# ⌨️ Fast Type Challenge\n\n**Player:** ${author.username}\n**Difficulty:** ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}\n**Time Limit:** ${timeLimit / 1000} seconds`,
				),
				new Separator(),
				new TextDisplay().setContent(
					`**Text to Type:**\n${gamePhase === "countdown" ? `\`${targetSentence}\`` : getDisplayText()}\n\n**Status:** ${getStatusMessage()}\n\n-# ${gamePhase === "playing" ? "Type the text above as fast and accurately as possible!" : gamePhase === "countdown" ? "Get ready to type!" : "Game finished!"}`,
				),
			);
		};

		const getGameButtons = (disabled = false) => {
			if (gamePhase === "ended") {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("fasttype_new")
							.setEmoji("🔄")
							.setLabel("New Game")
							.setStyle(ButtonStyle.Success)
							.setDisabled(disabled),
						new Button()
							.setCustomId("fasttype_difficulty")
							.setEmoji("⚙️")
							.setLabel("Change Difficulty")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(disabled),
					),
				];
			} else if (gamePhase === "countdown") {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("fasttype_start")
							.setEmoji("🚀")
							.setLabel(`Starting in ${countdown}...`)
							.setStyle(ButtonStyle.Primary)
							.setDisabled(true),
					),
				];
			} else {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("fasttype_submit")
							.setEmoji("✍️")
							.setLabel("Submit Answer")
							.setStyle(ButtonStyle.Primary)
							.setDisabled(disabled),
						new Button()
							.setCustomId("fasttype_stop")
							.setEmoji("⏹️")
							.setLabel("Stop Game")
							.setStyle(ButtonStyle.Danger)
							.setDisabled(disabled),
					),
				];
			}
		};

		// Start countdown
		const startCountdown = async () => {
			countdownInterval = setInterval(async () => {
				countdown--;

				if (countdown <= 0) {
					if (countdownInterval) clearInterval(countdownInterval);
					gamePhase = "playing";
					startTime = Date.now();

					// Start game timeout
					gameTimeout = setTimeout(async () => {
						gamePhase = "ended";
						endTime = Date.now();

						try {
							await ctx.editResponse({
								components: [getComponents(), ...getGameButtons()],
								flags: MessageFlags.IsComponentsV2,
							});
						} catch (error) {
							console.error("Error updating message on timeout:", error);
						}
					}, timeLimit);

					try {
						await ctx.editResponse({
							components: [getComponents(), ...getGameButtons()],
							flags: MessageFlags.IsComponentsV2,
						});
					} catch (error) {
						console.error("Error updating message after countdown:", error);
					}
				} else {
					try {
						await ctx.editResponse({
							components: [getComponents(), ...getGameButtons()],
							flags: MessageFlags.IsComponentsV2,
						});
					} catch (error) {
						console.error("Error updating countdown:", error);
					}
				}
			}, 1000);
		};

		// Send initial message
		const message = await ctx.write(
			{
				components: [getComponents(), ...getGameButtons()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		// Start countdown immediately
		await startCountdown();

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				i.user.id === author.id && i.customId.startsWith("fasttype_"),
			idle: 300000, // 5 minutes
		});

		// Message collector for typing - We'll handle this through the button collector instead
		// Since Seyfert doesn't support message collectors the same way, we'll provide instructions

		collector.run(
			/fasttype_(.+)/,
			async (interaction: ComponentInteraction) => {
				const action = interaction.customId.split("_")[1];

				if (action === "new") {
					// Reset game with same difficulty
					gamePhase = "countdown";
					const randomIndex = Math.floor(Math.random() * sentenceList.length);
					targetSentence = sentenceList[randomIndex] || "Default sentence";
					userInput = "";
					countdown = 3;

					// Clear existing timers
					if (countdownInterval) clearInterval(countdownInterval);
					if (gameTimeout) clearTimeout(gameTimeout);

					await interaction.update({
						components: [getComponents(), ...getGameButtons()],
						flags: MessageFlags.IsComponentsV2,
					});

					// Start new countdown
					await startCountdown();
					return;
				}

				if (action === "difficulty") {
					await interaction.write({
						content:
							"🎮 **Select a new difficulty:**\n\n**Easy:** Simple sentences\n**Medium:** Programming quotes\n**Hard:** Complex technical texts\n\nUse the command `/fasttype [difficulty]` to start a new game!",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				if (action === "stop") {
					gamePhase = "ended";
					endTime = Date.now();
					if (countdownInterval) clearInterval(countdownInterval);
					if (gameTimeout) clearTimeout(gameTimeout);

					await interaction.update({
						components: [getComponents(), ...getGameButtons()],
						flags: MessageFlags.IsComponentsV2,
					});
					return;
				}

				if (action === "submit") {
					// Create modal for typing input using Seyfert's Modal builder
					const input = new TextInput()
						.setCustomId("fasttype_modal_input")
						.setStyle(TextInputStyle.Short)
						.setPlaceholder("Type the sentence above here...")
						.setRequired(true);

					const field = new Label().setLabel("Your Answer").setComponent(input);
					const modal = new Modal()
						.setCustomId("fasttype_modal")
						.setTitle("Fast Type - Submit Your Answer")
						.setComponents([field])
						.run(async (i: ModalSubmitInteraction) => {
							// Handle modal submit
							const modalValue = i.getInputValue("fasttype_modal_input", true);
							userInput = Array.isArray(modalValue)
								? modalValue.join(" ")
								: modalValue;
							gamePhase = "ended";
							endTime = Date.now();
							await i.update({
								components: [getComponents(), ...getGameButtons()],
								flags: MessageFlags.IsComponentsV2,
							});
						});

					await interaction.modal(modal);
				}
			},
		);

		// ...existing code...

		// Collector end: clean up timers
		collector.stop = async (reason: string) => {
			if (countdownInterval) clearInterval(countdownInterval);
			if (gameTimeout) clearTimeout(gameTimeout);

			if (reason === "idle") {
				gamePhase = "ended";
				try {
					await message.edit({
						components: [getComponents(), ...getGameButtons(true)],
					});
				} catch (error) {
					console.error("Error updating message on collector end:", error);
				}
			}
		};
	}
}
