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

interface WYRQuestion {
	question: string;
	option1: string;
	option2: string;
}

// Local fallback questions
const localQuestions: WYRQuestion[] = [
	{
		question: "Superpowers Choice",
		option1: "Be able to fly",
		option2: "Be invisible",
	},
	{
		question: "Mental Abilities",
		option1: "Read minds",
		option2: "Predict the future",
	},
	{
		question: "Life Duration",
		option1: "Live forever",
		option2: "Live a perfect life for 50 years",
	},
	{
		question: "Success Type",
		option1: "Be incredibly rich",
		option2: "Be incredibly famous",
	},
	{
		question: "Time Management",
		option1: "Always be 10 minutes late",
		option2: "Always be 20 minutes early",
	},
	{
		question: "Physical Powers",
		option1: "Have super strength",
		option2: "Have super speed",
	},
	{
		question: "Media Choice",
		option1: "Never use internet again",
		option2: "Never watch TV/movies again",
	},
	{
		question: "Communication Skills",
		option1: "Speak every language fluently",
		option2: "Talk to animals",
	},
	{
		question: "Living Environment",
		option1: "Live in space",
		option2: "Live underwater",
	},
	{
		question: "Transportation Powers",
		option1: "Time travel",
		option2: "Teleport anywhere instantly",
	},
	{
		question: "Personal Attributes",
		option1: "Be the smartest person in the world",
		option2: "Be the most attractive person in the world",
	},
	{
		question: "Unlimited Resources",
		option1: "Have unlimited money",
		option2: "Have unlimited time",
	},
	{
		question: "Elemental Control",
		option1: "Control fire",
		option2: "Control water",
	},
	{
		question: "Pain Management",
		option1: "Never feel physical pain",
		option2: "Never feel emotional pain",
	},
	{
		question: "Personal Control",
		option1: "Change your appearance at will",
		option2: "Change your personality at will",
	},
	{
		question: "World Without",
		option1: "Live in a world without music",
		option2: "Live in a world without colors",
	},
	{
		question: "Healing Powers",
		option1: "Heal others",
		option2: "Bring people back to life",
	},
	{
		question: "Movie Genre",
		option1: "Be stuck in a romantic comedy",
		option2: "Be stuck in a horror movie",
	},
	{
		question: "Memory Control",
		option1: "Have photographic memory",
		option2: "Forget anything you want",
	},
	{
		question: "Truth and Lies",
		option1: "Always know when someone is lying",
		option2: "Always get away with lying",
	},
];

@Declare({
	name: "would-you-rather",
	description: "Play a game of Would You Rather!",
})
export default class WouldYouRatherCommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { author } = ctx;

		// Game state
		let gamePhase: "loading" | "playing" | "ended" = "loading";
		let questionData:
			| (WYRQuestion & {
					votes?: { option1: number; option2: number };
					questionAuthor?: string;
			  })
			| null = null;
		let userChoice: 1 | 2 | null = null;
		let isAPIQuestion = false;

		// Fetch question from API or use fallback
		const fetchQuestion = async (): Promise<boolean> => {
			// Try WYR.app API (with statistics)
			try {
				const response = await fetch(
					"https://io.wyr.app/api/v1/statements/en/daily?pageOffset=0&pageSize=1000",
				);
				const data = await response.json();
				if (data.statements && data.statements.length > 0) {
					const random =
						data.statements[Math.floor(Math.random() * data.statements.length)];
					questionData = {
						question: random.title,
						option1: random.phrase[0].text,
						option2: random.phrase[1].text,
						votes: {
							option1: random.phrase[0].count || 0,
							option2: random.phrase[1].count || 0,
						},
						questionAuthor: "WYR.app",
					};
					isAPIQuestion = true;
					return true;
				}
			} catch (error) {
				console.log("WYR.app API failed, trying TruthOrDareBot:", error);
			}

			// Try TruthOrDareBot API
			try {
				const response = await fetch("https://api.truthordarebot.xyz/v1/wyr");
				const data = await response.json();
				if (data.question) {
					// Split question into two options
					const parts = data.question.split(" or ");
					if (parts.length === 2) {
						questionData = {
							question: "Would you rather",
							option1: parts[0].replace("Would you rather", "").trim(),
							option2: parts[1].replace("?", "").trim(),
							votes: { option1: 0, option2: 0 },
							questionAuthor: "TruthOrDareBot",
						};
						isAPIQuestion = true;
						return true;
					}
				}
			} catch (error) {
				console.log("TruthOrDareBot API failed, using local questions:", error);
			}

			// Fallback to local questions
			const randomQuestion =
				localQuestions[Math.floor(Math.random() * localQuestions.length)];
			if (randomQuestion) {
				questionData = {
					...randomQuestion,
					votes: { option1: 0, option2: 0 },
					questionAuthor: "Local Database",
				};
				isAPIQuestion = false;
				return true;
			}

			return false;
		};

		const getComponents = (isGameOver = false) => {
			if (!questionData) {
				return new Container().addComponents(
					new TextDisplay().setContent(
						"🔄 **Loading Would You Rather question...**",
					),
				);
			}

			const statusText =
				gamePhase === "loading"
					? "🔄 **Loading...**"
					: gamePhase === "playing"
						? "🤔 **Make your choice!**"
						: userChoice === 1
							? `✅ **You chose Option 1!**`
							: `✅ **You chose Option 2!**`;

			let descriptionText = `**Question:** ${questionData.question}\n\n`;
			descriptionText += `**1.** ${questionData.option1}\n`;
			descriptionText += `**2.** ${questionData.option2}\n\n`;

			if (
				(gamePhase === "ended" || isGameOver) &&
				questionData.votes &&
				isAPIQuestion
			) {
				const total = questionData.votes.option1 + questionData.votes.option2;
				if (total > 0) {
					const percent1 = Math.round(
						(questionData.votes.option1 / total) * 100,
					);
					const percent2 = Math.round(
						(questionData.votes.option2 / total) * 100,
					);
					descriptionText += `**Global Results:**\n`;
					descriptionText += `Option 1: ${percent1}% (${questionData.votes.option1} votes)\n`;
					descriptionText += `Option 2: ${percent2}% (${questionData.votes.option2} votes)\n\n`;
				}
			}

			const sourceText = isAPIQuestion ? "Online Database" : "Local Database";

			return new Container().addComponents(
				new TextDisplay().setContent(
					`# ❓ Would You Rather\n\n**Player:** ${author.username}\n**Source:** ${sourceText}${questionData.questionAuthor ? `\n**Question by:** ${questionData.questionAuthor}` : ""}`,
				),
				new Separator(),
				new TextDisplay().setContent(
					`${descriptionText}**Status:** ${isGameOver ? `**Game Ended!**\n\n-# Thanks for playing ${author.username}!` : statusText}\n\n${!isGameOver ? "-# Choose your option below!" : ""}`,
				),
			);
		};

		const getChoiceButtons = (disabled = false) => {
			if (!questionData || gamePhase === "loading") {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("wyr_loading")
							.setLabel("Loading...")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true),
					),
				];
			}

			const button1Style =
				gamePhase === "ended" && userChoice === 1
					? ButtonStyle.Success
					: ButtonStyle.Primary;
			const button2Style =
				gamePhase === "ended" && userChoice === 2
					? ButtonStyle.Success
					: ButtonStyle.Primary;

			const buttons = [
				new ActionRow<Button>().addComponents(
					new Button()
						.setCustomId("wyr_1")
						.setEmoji("1️⃣")
						.setLabel(`Option 1`)
						.setStyle(button1Style)
						.setDisabled(disabled || gamePhase === "ended"),
					new Button()
						.setCustomId("wyr_2")
						.setEmoji("2️⃣")
						.setLabel(`Option 2`)
						.setStyle(button2Style)
						.setDisabled(disabled || gamePhase === "ended"),
				),
			];

			if (gamePhase === "ended") {
				buttons.push(
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("wyr_new")
							.setEmoji("🔄")
							.setLabel("New Question")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(disabled),
					),
				);
			}

			return buttons;
		};

		// Send loading message first
		const message = (await ctx.write(
			{
				components: [getComponents(), ...getChoiceButtons()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		)) as any;

		// Fetch question
		const questionFetched = await fetchQuestion();

		if (!questionFetched) {
			try {
				await ctx.editResponse({
					content:
						"❌ **Error:** Could not load Would You Rather question. Please try again later!",
					components: [],
					flags: MessageFlags.IsComponentsV2, // Always include this flag
				});
			} catch (error: any) {
				console.error("Error displaying load failure:", error);
			}
			return;
		}

		// Update with actual question and start game
		gamePhase = "playing";
		try {
			await ctx.editResponse({
				components: [getComponents(), ...getChoiceButtons()],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			console.error("Error updating initial message:", error);
		}

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: any) =>
				i.user.id === author.id && i.customId.startsWith("wyr_"),
			idle: 300000, // 5 minutes
		});

		collector.run(/wyr_(.+)/, async (interaction: any) => {
			const action = interaction.customId.split("_")[1];

			if (action === "new") {
				// Reset game state
				gamePhase = "loading";
				questionData = null;
				userChoice = null;
				isAPIQuestion = false;

				try {
					await interaction.update({
						components: [getComponents(), ...getChoiceButtons()],
						flags: MessageFlags.IsComponentsV2,
					});
				} catch (error: any) {
					console.error("Error updating interaction for new question:", error);
				}

				// Fetch new question
				const newQuestionFetched = await fetchQuestion();

				if (!newQuestionFetched) {
					try {
						await ctx.editResponse({
							content:
								"❌ **Error:** Could not load Would You Rather question. Please try again later!",
							components: [],
							flags: MessageFlags.IsComponentsV2, // Always include this flag
						});
					} catch (error: any) {
						console.error("Error displaying new question load failure:", error);
					}
					collector.stop("error");
					return;
				}

				// Start new game
				gamePhase = "playing";
				try {
					await ctx.editResponse({
						components: [getComponents(), ...getChoiceButtons()],
						flags: MessageFlags.IsComponentsV2,
					});
				} catch (error: any) {
					console.error("Error updating with new question:", error);
					if (
						typeof error.message === "string" &&
						error.message.includes("Unknown Webhook")
					) {
						console.log("Webhook error suppressed, continuing game");
					}
				}
				return;
			}

			// Handle choice selection
			if (gamePhase === "playing") {
				const choice = parseInt(action);

				if (choice !== 1 && choice !== 2) {
					return;
				}

				gamePhase = "ended";
				userChoice = choice as 1 | 2;

				try {
					await interaction.update({
						components: [getComponents(), ...getChoiceButtons()],
						flags: MessageFlags.IsComponentsV2,
					});
				} catch (error: any) {
					console.error("Error updating choice selection:", error);
				}
			}
		});

		// Collector end: disable buttons
		collector.stop = (reason: string) => {
			if (reason === "idle" || reason === "error") {
				gamePhase = "ended";
				message
					.edit({
						components: [getComponents(true), ...getChoiceButtons(true)],
						flags: MessageFlags.IsComponentsV2,
					})
					.catch((error: any) => {
						console.error("Error updating message on collector end:", error);
						// Suppress webhook errors - they're usually due to expired messages
						if (
							typeof error.message === "string" &&
							(error.message.includes("Unknown Webhook") ||
								error.message.includes(
									"MESSAGE_CANNOT_REMOVE_COMPONENTS_V2_FLAG",
								))
						) {
							console.log("Webhook error suppressed:", error.message);
						}
					});
			}
		};
	}
}
