import {
	Declare,
	type CommandContext,
	SubCommand,
	Options,
	createStringOption,
	Container,
	TextDisplay,
	Separator,
	ActionRow,
	Button,
	TextInput,
	Modal,
	type ComponentInteraction,
	type ModalSubmitInteraction,
} from "seyfert";
import { ButtonStyle, MessageFlags, TextInputStyle } from "seyfert/lib/types";

const options = {
	generation: createStringOption({
		description: "Select Pokemon generation",
		choices: [
			{ name: "Generation 1 (Kanto)", value: "1" },
			{ name: "Generation 2 (Johto)", value: "2" },
			{ name: "Generation 3 (Hoenn)", value: "3" },
			{ name: "Generation 4 (Sinnoh)", value: "4" },
			{ name: "Generation 5 (Unova)", value: "5" },
			{ name: "All Generations", value: "all" },
		],
		required: false,
	}),
};

// Fallback Pokemon data in case API fails
const fallbackPokemon = [
	{
		name: "Pikachu",
		types: ["Electric"],
		abilities: ["Static", "Lightning Rod"],
		generation: 1,
		sprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
		hiddenSprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
	},
	{
		name: "Charizard",
		types: ["Fire", "Flying"],
		abilities: ["Blaze", "Solar Power"],
		generation: 1,
		sprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
		hiddenSprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
	},
	{
		name: "Blastoise",
		types: ["Water"],
		abilities: ["Torrent", "Rain Dish"],
		generation: 1,
		sprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png",
		hiddenSprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png",
	},
	{
		name: "Venusaur",
		types: ["Grass", "Poison"],
		abilities: ["Overgrow", "Chlorophyll"],
		generation: 1,
		sprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png",
		hiddenSprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png",
	},
	{
		name: "Mewtwo",
		types: ["Psychic"],
		abilities: ["Pressure", "Unnerve"],
		generation: 1,
		sprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png",
		hiddenSprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png",
	},
	{
		name: "Lugia",
		types: ["Psychic", "Flying"],
		abilities: ["Pressure", "Multiscale"],
		generation: 2,
		sprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/249.png",
		hiddenSprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png",
	},
	{
		name: "Rayquaza",
		types: ["Dragon", "Flying"],
		abilities: ["Air Lock", "Delta Stream"],
		generation: 3,
		sprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png",
		hiddenSprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png",
	},
	{
		name: "Dialga",
		types: ["Steel", "Dragon"],
		abilities: ["Pressure", "Telepathy"],
		generation: 4,
		sprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/483.png",
		hiddenSprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/483.png",
	},
	{
		name: "Reshiram",
		types: ["Dragon", "Fire"],
		abilities: ["Turboblaze"],
		generation: 5,
		sprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/643.png",
		hiddenSprite:
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/643.png",
	},
];

interface PokemonData {
	name: string;
	types: string[];
	abilities: string[];
	generation?: number;
	sprite: string;
	hiddenSprite: string;
}

interface PokemonType {
	type: {
		name: string;
	};
}

interface PokemonAbility {
	ability: {
		name: string;
	};
}

interface PokemonApiData {
	id: number;
	name: string;
	types: PokemonType[];
	abilities: PokemonAbility[];
	species: {
		url: string;
	};
	sprites: {
		front_default: string;
		other?: {
			"official-artwork"?: {
				front_default: string;
			};
		};
	};
}

interface PokemonSpeciesData {
	generation: {
		url: string;
	};
}

@Declare({
	name: "guesspokemon",
	description: "Guess the Pokemon from its silhouette!",
})
@Options(options)
export default class GuessPokemonCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>) {
		const { author } = ctx;
		const generation = ctx.options.generation || "all";

		// Game state
		let gamePhase: "loading" | "playing" | "ended" = "loading";
		let pokemonData: PokemonData | null = null;
		let userGuess: string | null = null;
		let timeLeft = 60;
		let timer: NodeJS.Timeout | null = null;
		let isAPIData = false;

		// Fetch Pokemon data
		const fetchPokemon = async (): Promise<boolean> => {
			try {
				// Try to fetch from PokeAPI
				const randomId = Math.floor(Math.random() * 1010) + 1; // Pokemon IDs go up to ~1010
				const response = await fetch(
					`https://pokeapi.co/api/v2/pokemon/${randomId}`,
				);

				if (response.ok) {
					const data = (await response.json()) as PokemonApiData;

					// Get species data for generation info
					const speciesResponse = await fetch(data.species.url);
					const speciesData =
						(await speciesResponse.json()) as PokemonSpeciesData;

					pokemonData = {
						name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
						types: data.types.map(
							(t: PokemonType) =>
								t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1),
						),
						abilities: data.abilities.map(
							(a: PokemonAbility) =>
								a.ability.name.charAt(0).toUpperCase() +
								a.ability.name.slice(1).replace("-", " "),
						),
						generation: parseInt(
							speciesData.generation.url.split("/").slice(-2)[0] || "1",
						),
						sprite:
							data.sprites.other?.["official-artwork"]?.front_default ||
							data.sprites.front_default,
						hiddenSprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`,
					};

					// Filter by generation if specified
					if (
						generation !== "all" &&
						pokemonData &&
						pokemonData.generation !== parseInt(generation)
					) {
						throw new Error("Generation mismatch");
					}

					isAPIData = true;
					return true;
				}
			} catch (error) {
				console.log("API failed, using fallback data:", error);
			}

			// Fallback to local data
			let filteredPokemon = fallbackPokemon;
			if (generation !== "all") {
				filteredPokemon = fallbackPokemon.filter(
					(p) => p.generation === parseInt(generation),
				);
			}

			if (filteredPokemon.length > 0) {
				const randomIndex = Math.floor(Math.random() * filteredPokemon.length);
				pokemonData =
					filteredPokemon[randomIndex] || fallbackPokemon[0] || null;
				isAPIData = false;
				return pokemonData !== null;
			}

			return false;
		};

		const getComponents = () => {
			if (!pokemonData) {
				return new Container().addComponents(
					new TextDisplay().setContent("🔄 **Loading Pokemon data...**"),
				);
			}

			const generationText =
				generation === "all" ? "All Generations" : `Generation ${generation}`;
			const sourceText = isAPIData ? "PokeAPI" : "Local Database";

			const statusText =
				gamePhase === "loading"
					? "🔄 **Loading...**"
					: gamePhase === "playing"
						? `🕒 **Time left: ${timeLeft}s** - Who's that Pokemon?`
						: userGuess?.toLowerCase() === pokemonData.name.toLowerCase()
							? `🎉 **Correct! It's ${pokemonData.name}!**`
							: `❌ **Wrong! It was ${pokemonData.name}!**`;

			return new Container().addComponents(
				new TextDisplay().setContent(
					`# 👤 Who's That Pokemon?\n\n**Player:** ${author.username}\n**Generation:** ${generationText}\n**Source:** ${sourceText}`,
				),
				new Separator(),
				new TextDisplay().setContent(
					`**Pokemon Info:**\n**Types:** ${pokemonData.types.join(", ")}\n**Abilities:** ${pokemonData.abilities.join(", ")}\n\n**Status:** ${statusText}\n\n-# Type your guess in chat or use the hint button!`,
				),
			);
		};

		const getGameButtons = (disabled = false) => {
			if (!pokemonData || gamePhase === "loading") {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("pokemon_loading")
							.setLabel("Loading...")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true),
					),
				];
			}

			if (gamePhase === "ended") {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("pokemon_new")
							.setEmoji("🔄")
							.setLabel("New Pokemon")
							.setStyle(ButtonStyle.Success)
							.setDisabled(disabled),
						new Button()
							.setCustomId("pokemon_reveal")
							.setEmoji("👁️")
							.setLabel("Show Pokemon")
							.setStyle(ButtonStyle.Primary)
							.setDisabled(disabled),
					),
				];
			} else {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("pokemon_submit")
							.setEmoji("✍️")
							.setLabel("Submit Guess")
							.setStyle(ButtonStyle.Primary)
							.setDisabled(disabled),
						new Button()
							.setCustomId("pokemon_hint")
							.setEmoji("💡")
							.setLabel("Get Hint")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(disabled),
						new Button()
							.setCustomId("pokemon_give_up")
							.setEmoji("🏳️")
							.setLabel("Give Up")
							.setStyle(ButtonStyle.Danger)
							.setDisabled(disabled),
					),
				];
			}
		};

		// Start timer
		const startTimer = () => {
			timer = setInterval(async () => {
				timeLeft--;
				if (timeLeft <= 0) {
					gamePhase = "ended";
					userGuess = "timeout";
					if (timer) clearInterval(timer);

					try {
						await ctx.editResponse({
							components: [getComponents(), ...getGameButtons()],
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
				components: [getComponents(), ...getGameButtons()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		// Fetch Pokemon data
		const pokemonFetched = await fetchPokemon();

		if (!pokemonFetched) {
			await ctx.editResponse({
				content:
					"❌ **Error:** Could not load Pokemon data. Please try again later!",
				components: [],
			});
			return;
		}

		// Update with actual Pokemon and start game
		gamePhase = "playing";
		await ctx.editResponse({
			components: [getComponents(), ...getGameButtons()],
			flags: MessageFlags.IsComponentsV2,
		});

		// Start the timer
		startTimer();

		// Since Seyfert doesn't support message collectors the same way as Discord.js,
		// we'll rely on button interactions primarily for game input

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				i.user.id === author.id && i.customId.startsWith("pokemon_"),
			idle: 120000, // 2 minutes
		});

		collector.run(/pokemon_(.+)/, async (interaction: ComponentInteraction) => {
			const action = interaction.customId.split("_")[1];
			if (!action) return;

			if (action === "new") {
				// Reset game
				gamePhase = "loading";
				pokemonData = null;
				userGuess = null;
				timeLeft = 60;
				isAPIData = false;
				if (timer) clearInterval(timer);

				await interaction.update({
					components: [getComponents(), ...getGameButtons()],
					flags: MessageFlags.IsComponentsV2,
				});

				// Fetch new Pokemon
				const newPokemonFetched = await fetchPokemon();

				if (!newPokemonFetched) {
					await ctx.editResponse({
						content:
							"❌ **Error:** Could not load Pokemon data. Please try again later!",
						components: [],
					});
					collector.stop("error");
					return;
				}

				// Start new game
				gamePhase = "playing";
				await ctx.editResponse({
					components: [getComponents(), ...getGameButtons()],
					flags: MessageFlags.IsComponentsV2,
				});

				startTimer();
				return;
			}

			if (action === "hint") {
				if (!pokemonData) return;

				const hints = [
					`First letter: **${pokemonData.name[0]}**`,
					`Length: **${pokemonData.name.length} letters**`,
					`Last letter: **${pokemonData.name[pokemonData.name.length - 1]}**`,
					`Second letter: **${pokemonData.name[1] || "N/A"}**`,
				];

				const randomHint = hints[Math.floor(Math.random() * hints.length)];

				await interaction.write({
					content: `💡 **Hint:** ${randomHint}`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (action === "give_up") {
				gamePhase = "ended";
				userGuess = "gave_up";
				if (timer) clearInterval(timer);

				await interaction.update({
					components: [getComponents(), ...getGameButtons()],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			if (action === "reveal") {
				if (!pokemonData) return;

				await interaction.write({
					content: `🎨 **${pokemonData.name}**\n${pokemonData.sprite ? `Here's the full image: ${pokemonData.sprite}` : "Image not available"}`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (action === "submit") {
				// Show modal for user guess
				const input = new TextInput()
					.setCustomId("pokemon_modal_input")
					.setLabel("Your Guess")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder("Type the Pokemon name...")
					.setRequired(true);

				const row = new ActionRow<TextInput>().setComponents([input]);
				const modal = new Modal()
					.setCustomId("pokemon_modal")
					.setTitle("Guess the Pokemon")
					.setComponents([row])
					.run(async (i: ModalSubmitInteraction) => {
						// Handle modal submit
						const guessValue = i.getInputValue("pokemon_modal_input", true);
						userGuess = guessValue;
						gamePhase = "ended";
						if (timer) clearInterval(timer);
						await i.update({
							components: [getComponents(), ...getGameButtons()],
							flags: MessageFlags.IsComponentsV2,
						});
					});

				await interaction.modal(modal);
			}
		});

		// Collector end: clean up timer
		collector.stop = async (reason: string) => {
			if (timer) clearInterval(timer);

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
