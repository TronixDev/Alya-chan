import ky from "ky";
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
	category: createStringOption({
		description: "Select a trivia category",
		choices: [
			{ name: "General Knowledge", value: "9" },
			{ name: "Books", value: "10" },
			{ name: "Film", value: "11" },
			{ name: "Music", value: "12" },
			{ name: "Musicals & Theatres", value: "13" },
			{ name: "Television", value: "14" },
			{ name: "Video Games", value: "15" },
			{ name: "Board Games", value: "16" },
			{ name: "Science & Nature", value: "17" },
			{ name: "Computers", value: "18" },
			{ name: "Mathematics", value: "19" },
			{ name: "Mythology", value: "20" },
			{ name: "Sports", value: "21" },
			{ name: "Geography", value: "22" },
			{ name: "History", value: "23" },
			{ name: "Animals", value: "24" },
			{ name: "Vehicles", value: "25" },
		],
		required: false,
	}),
	difficulty: createStringOption({
		description: "Select difficulty level",
		choices: [
			{ name: "Easy", value: "easy" },
			{ name: "Medium", value: "medium" },
			{ name: "Hard", value: "hard" },
		],
		required: false,
	}),
};

// Fallback trivia questions in case API fails
const fallbackQuestions = {
	easy: [
		{
			category: "General Knowledge",
			question: "What is the capital of France?",
			correct_answer: "Paris",
			incorrect_answers: ["London", "Berlin", "Madrid"],
		},
		{
			category: "Science",
			question: "How many legs does a spider have?",
			correct_answer: "8",
			incorrect_answers: ["6", "10", "12"],
		},
		{
			category: "Colors",
			question: "What color do you get when you mix red and white?",
			correct_answer: "Pink",
			incorrect_answers: ["Orange", "Purple", "Yellow"],
		},
		{
			category: "Space",
			question: "Which planet is known as the Red Planet?",
			correct_answer: "Mars",
			incorrect_answers: ["Venus", "Jupiter", "Saturn"],
		},
	],
	medium: [
		{
			category: "Chemistry",
			question: "What is the chemical symbol for gold?",
			correct_answer: "Au",
			incorrect_answers: ["Go", "Gd", "Ag"],
		},
		{
			category: "History",
			question: "In which year did World War II end?",
			correct_answer: "1945",
			incorrect_answers: ["1944", "1946", "1947"],
		},
		{
			category: "Animals",
			question: "What is the largest mammal in the world?",
			correct_answer: "Blue Whale",
			incorrect_answers: ["African Elephant", "Giraffe", "Polar Bear"],
		},
		{
			category: "Art",
			question: "Who painted the Mona Lisa?",
			correct_answer: "Leonardo da Vinci",
			incorrect_answers: ["Van Gogh", "Picasso", "Michelangelo"],
		},
	],
	hard: [
		{
			category: "Geography",
			question: "What is the smallest country in the world?",
			correct_answer: "Vatican City",
			incorrect_answers: ["Monaco", "Nauru", "San Marino"],
		},
		{
			category: "Science",
			question: "What is the hardest natural substance on Earth?",
			correct_answer: "Diamond",
			incorrect_answers: ["Quartz", "Titanium", "Graphite"],
		},
		{
			category: "Literature",
			question: "Who wrote the novel '1984'?",
			correct_answer: "George Orwell",
			incorrect_answers: ["Aldous Huxley", "Ray Bradbury", "H.G. Wells"],
		},
		{
			category: "Geography",
			question: "What is the capital of Australia?",
			correct_answer: "Canberra",
			incorrect_answers: ["Sydney", "Melbourne", "Perth"],
		},
	],
};

interface TriviaQuestion {
	category: string;
	type?: string;
	difficulty?: string;
	question: string;
	correct_answer: string;
	incorrect_answers: string[];
}

interface TriviaResponse {
	response_code: number;
	results: TriviaQuestion[];
}

@Declare({
	name: "trivia",
	description: "Test your knowledge with trivia questions!",
})
@Options(options)
export default class TriviaCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>) {
		const { author } = ctx;
		const category = ctx.options.category || "9"; // Default to General Knowledge
		const difficulty = ctx.options.difficulty || "medium"; // Default to medium

		// Game state
		let gamePhase: "loading" | "playing" | "ended" = "loading";
		let questionData: TriviaQuestion | null = null;
		let answers: string[] = [];
		let correctAnswerIndex = -1;
		let playerAnswer: string | null = null;
		let timeLeft = 30;
		let timer: NodeJS.Timeout | null = null;
		let isAPIQuestion = false;

		// Simple HTML entity decoder for Node.js environment
		const simpleDecodeHTML = (text: string): string => {
			return text
				.replace(/&quot;/g, '"')
				.replace(/&#039;/g, "'")
				.replace(/&amp;/g, "&")
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">")
				.replace(/&nbsp;/g, " ")
				.replace(/&ldquo;/g, '"')
				.replace(/&rdquo;/g, '"')
				.replace(/&lsquo;/g, "'")
				.replace(/&rsquo;/g, "'");
		};

		// Fetch trivia question from API or use fallback
		const fetchQuestion = async (): Promise<boolean> => {
			try {
				// Try API first
				const url = `https://opentdb.com/api.php?amount=1&category=${category}&difficulty=${difficulty}&type=multiple`;
				const response = await ky.get(url, { throwHttpErrors: false });
				const data: TriviaResponse = await response.json();

				if (data.response_code === 0 && data.results[0]) {
					questionData = data.results[0];
					isAPIQuestion = true;

					// Decode HTML entities
					questionData.question = simpleDecodeHTML(questionData.question);
					questionData.correct_answer = simpleDecodeHTML(
						questionData.correct_answer,
					);
					questionData.incorrect_answers =
						questionData.incorrect_answers.map(simpleDecodeHTML);
				} else {
					throw new Error("API returned no results");
				}
			} catch (error) {
				// Fallback to local questions
				console.log("Using fallback questions:", error);
				const fallbackQuestionSet =
					fallbackQuestions[difficulty as keyof typeof fallbackQuestions];
				const randomQuestion =
					fallbackQuestionSet[
						Math.floor(Math.random() * fallbackQuestionSet.length)
					];

				if (randomQuestion) {
					questionData = {
						...randomQuestion,
						difficulty: difficulty,
						type: "multiple",
					};
					isAPIQuestion = false;
				} else {
					return false;
				}
			}

			if (!questionData) return false;

			// Mix answers randomly
			answers = [
				...questionData.incorrect_answers,
				questionData.correct_answer,
			];
			answers.sort(() => Math.random() - 0.5);
			correctAnswerIndex = answers.indexOf(questionData.correct_answer);

			return true;
		};

		// Get difficulty emoji
		const getDifficultyEmoji = (diff: string): string => {
			switch (diff) {
				case "easy":
					return "🟢";
				case "medium":
					return "🟡";
				case "hard":
					return "🔴";
				default:
					return "⚪";
			}
		};

		// Get answer button style
		const getAnswerButtonStyle = (answerIndex: number): ButtonStyle => {
			if (gamePhase !== "ended") return ButtonStyle.Primary;

			if (answerIndex === correctAnswerIndex) {
				return ButtonStyle.Success; // Correct answer
			} else if (playerAnswer === answers[answerIndex]) {
				return ButtonStyle.Danger; // Wrong answer chosen by player
			}
			return ButtonStyle.Secondary; // Other wrong answers
		};

		const getComponents = () => {
			if (!questionData) {
				return new Container().addComponents(
					new TextDisplay().setContent("🔄 **Loading trivia question...**"),
				);
			}

			const categoryName = questionData.category;
			const difficultyDisplay = `${getDifficultyEmoji(questionData.difficulty || difficulty)} ${(questionData.difficulty || difficulty).charAt(0).toUpperCase() + (questionData.difficulty || difficulty).slice(1)}`;
			const sourceText = isAPIQuestion
				? "Open Trivia Database"
				: "Local Database";

			const statusText =
				gamePhase === "loading"
					? "🔄 **Loading...**"
					: gamePhase === "playing"
						? `⏱️ **Time left: ${timeLeft}s**`
						: playerAnswer === questionData.correct_answer
							? "✅ **Correct! Well done!**"
							: playerAnswer === "timeout"
								? `⏰ **Time's up! The correct answer was: ${questionData.correct_answer}**`
								: `❌ **Wrong! The correct answer was: ${questionData.correct_answer}**`;

			return new Container().addComponents(
				new TextDisplay().setContent(
					`# 🧠 Trivia Challenge\n\n**Category:** ${categoryName}\n**Difficulty:** ${difficultyDisplay}\n**Player:** ${author.username}\n**Source:** ${sourceText}`,
				),
				new Separator(),
				new TextDisplay().setContent(
					`**Question:**\n${questionData.question}\n\n**Status:** ${statusText}\n\n-# Select your answer below!`,
				),
			);
		};

		const getAnswerButtons = (disabled = false) => {
			if (!questionData || gamePhase === "loading") {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("trivia_loading")
							.setLabel("Loading...")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true),
					),
				];
			}

			const buttonRows: ActionRow<Button>[] = [];
			const letters = ["A", "B", "C", "D"];

			for (let i = 0; i < answers.length; i++) {
				const answer = answers[i];
				const letter = letters[i];
				if (!answer || !letter) continue;

				buttonRows.push(
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId(`trivia_${i}`)
							.setLabel(
								`${letter}) ${answer.length > 60 ? `${answer.substring(0, 57)}...` : answer}`,
							)
							.setStyle(getAnswerButtonStyle(i))
							.setDisabled(disabled || gamePhase === "ended"),
					),
				);
			}

			if (gamePhase === "ended") {
				buttonRows.push(
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("trivia_new")
							.setEmoji("🔄")
							.setLabel("New Question")
							.setStyle(ButtonStyle.Success)
							.setDisabled(disabled),
					),
				);
			}

			return buttonRows;
		};

		// Start timer
		const startTimer = () => {
			timer = setInterval(async () => {
				timeLeft--;
				if (timeLeft <= 0) {
					gamePhase = "ended";
					playerAnswer = "timeout";
					if (timer) clearInterval(timer);

					// Update message with timeout
					try {
						await ctx.editResponse({
							components: [getComponents(), ...getAnswerButtons(true)],
							flags: MessageFlags.IsComponentsV2,
						});
					} catch (error) {
						console.error("Error updating message on timeout:", error);
					}
				}
			}, 1000);
		};

		// Send loading message first
		const message = await ctx.write(
			{
				components: [getComponents(), ...getAnswerButtons()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		// Fetch question
		const questionFetched = await fetchQuestion();

		if (!questionFetched) {
			await ctx.editResponse({
				content:
					"❌ **Error:** Could not load trivia question. Please try again later!",
				components: [],
			});
			return;
		}

		// Update with actual question and start game
		gamePhase = "playing";
		await ctx.editResponse({
			components: [getComponents(), ...getAnswerButtons()],
			flags: MessageFlags.IsComponentsV2,
		});

		// Start the timer
		startTimer();

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				i.user.id === author.id && i.customId.startsWith("trivia_"),
			idle: 60000, // 1 minute
		});

		collector.run(/trivia_(.+)/, async (interaction: ComponentInteraction) => {
			const action = interaction.customId.split("_")[1];

			if (action === "new") {
				// Reset game state
				gamePhase = "loading";
				questionData = null;
				answers = [];
				correctAnswerIndex = -1;
				playerAnswer = null;
				timeLeft = 30;
				isAPIQuestion = false;
				if (timer) clearInterval(timer);

				await interaction.update({
					components: [getComponents(), ...getAnswerButtons()],
					flags: MessageFlags.IsComponentsV2,
				});

				// Fetch new question
				const newQuestionFetched = await fetchQuestion();

				if (!newQuestionFetched) {
					await ctx.editResponse({
						content:
							"❌ **Error:** Could not load trivia question. Please try again later!",
						components: [],
					});
					collector.stop("error");
					return;
				}

				// Start new game
				gamePhase = "playing";
				await ctx.editResponse({
					components: [getComponents(), ...getAnswerButtons()],
					flags: MessageFlags.IsComponentsV2,
				});

				startTimer();
				return;
			}

			// Handle answer selection
			if (gamePhase === "playing") {
				const action = interaction.customId.split("_")[1];
				if (!action) return;

				const answerIndex = parseInt(action, 10);

				if (
					Number.isNaN(answerIndex) ||
					answerIndex < 0 ||
					answerIndex >= answers.length
				) {
					return;
				}

				gamePhase = "ended";
				const selectedAnswer = answers[answerIndex];
				if (selectedAnswer) {
					playerAnswer = selectedAnswer;
				}
				if (timer) clearInterval(timer);

				await interaction.update({
					components: [getComponents(), ...getAnswerButtons()],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		});

		// Collector end: clean up timer
		collector.stop = async (reason: string) => {
			if (timer) clearInterval(timer);

			if (reason === "idle") {
				gamePhase = "ended";
				try {
					await ctx.editResponse({
						components: [getComponents(), ...getAnswerButtons(true)],
					});
				} catch (error) {
					console.error("Error updating message on collector end:", error);
				}
			}
		};
	}
}
