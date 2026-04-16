import {
	ActionRow,
	Button,
	type CommandContext,
	type ComponentInteraction,
	Container,
	createIntegerOption,
	createStringOption,
	Declare,
	Options,
	Separator,
	SubCommand,
	TextDisplay,
} from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";

const options = {
	action: createStringOption({
		description: "What do you want to do?",
		choices: [
			{ name: "Fish", value: "fish" },
			{ name: "Inventory", value: "inventory" },
			{ name: "Sell", value: "sell" },
		],
		required: true,
	}),
	fish_type: createStringOption({
		description: "Type of fish to sell",
		choices: [
			{ name: "Junk", value: "junk" },
			{ name: "Common", value: "common" },
			{ name: "Uncommon", value: "uncommon" },
			{ name: "Rare", value: "rare" },
		],
		required: false,
	}),
	amount: createIntegerOption({
		description: "Amount to sell",
		required: false,
		min_value: 1,
		max_value: 100,
	}),
};

// Fish types and their properties
const fishTypes = {
	junk: { emoji: "🔧", name: "Junk", price: 5, rarity: 50 }, // 50% chance
	common: { emoji: "🐟", name: "Common Fish", price: 10, rarity: 30 }, // 30% chance
	uncommon: { emoji: "🐠", name: "Uncommon Fish", price: 20, rarity: 15 }, // 15% chance
	rare: { emoji: "🐡", name: "Rare Fish", price: 50, rarity: 5 }, // 5% chance
};

// Simple in-memory storage for demo (in production, you'd use a database)
const playerData: {
	[userId: string]: { balance: number; fishes: { [key: string]: number } };
} = {};

// Define fish type interface
interface FishData {
	emoji: string;
	name: string;
	price: number;
	rarity: number;
}

// Define player interface
interface PlayerData {
	balance: number;
	fishes: { [key: string]: number };
}

@Declare({
	name: "fishy",
	description: "Go fishing and manage your fish inventory!",
})
@Options(options)
export default class FishyCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>) {
		const { author } = ctx;
		const action = ctx.options.action;
		const fishType = ctx.options.fish_type;
		const amount = ctx.options.amount || 1;

		// Initialize player data if not exists
		if (!playerData[author.id]) {
			playerData[author.id] = {
				balance: 50,
				fishes: { junk: 0, common: 0, uncommon: 0, rare: 0 },
			};
		}

		const player = playerData[author.id];
		if (!player) {
			playerData[author.id] = {
				balance: 50,
				fishes: { junk: 0, common: 0, uncommon: 0, rare: 0 },
			};
		}
		const playerGameData = playerData[author.id] as PlayerData;
		const fishingRodPrice = 10;

		if (action === "fish") {
			await this.handleFishing(ctx, playerGameData, fishingRodPrice);
		} else if (action === "inventory") {
			await this.showInventory(ctx, playerGameData);
		} else if (action === "sell") {
			if (!fishType) {
				await ctx.editOrReply({
					content: "❌ **Error:** Please specify the fish type to sell!",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			await this.handleSelling(ctx, playerGameData, fishType, amount);
		}
	}

	private async handleFishing(
		ctx: CommandContext<typeof options>,
		player: PlayerData,
		rodPrice: number,
	) {
		if (player.balance < rodPrice) {
			const components = new Container().addComponents(
				new TextDisplay().setContent(
					`# 🎣 Fishing\n\n❌ **Insufficient Balance!**\n\nYou need **${rodPrice} coins** to rent a fishing rod.\nYour balance: **${player.balance} coins**\n\nSell some fish to earn more coins!`,
				),
			);

			await ctx.editOrReply({
				components: [components],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		// Game state for fishing
		let gamePhase: "fishing" | "caught" | "ended" = "fishing";
		let caughtFish: { type: string; fish: FishData } | null = null;
		let fishingProgress = 0;
		let fishingInterval: NodeJS.Timeout | null = null;

		// Determine what fish was caught
		const determineCatch = (): { type: string; fish: FishData } => {
			const roll = Math.random() * 100;
			let cumulative = 0;

			for (const [type, fish] of Object.entries(fishTypes)) {
				cumulative += fish.rarity;
				if (roll <= cumulative) {
					return { type, fish };
				}
			}

			// Fallback to junk
			return { type: "junk", fish: fishTypes.junk };
		};

		const getComponents = () => {
			if (gamePhase === "fishing") {
				// Clamp repeat arguments to valid range (0-10)
				const filled = Math.max(
					0,
					Math.min(10, Math.floor(fishingProgress / 10)),
				);
				const empty = Math.max(0, 10 - filled);
				const progressBar = "▓".repeat(filled) + "░".repeat(empty);
				return new Container().addComponents(
					new TextDisplay().setContent(
						`# 🎣 Fishing\n\n**Player:** ${ctx.author.username}\n**Balance:** ${player.balance} coins\n**Rod Cost:** ${rodPrice} coins`,
					),
					new Separator(),
					new TextDisplay().setContent(
						`🌊 **Fishing in progress...**\n\nProgress: [${progressBar}] ${fishingProgress}%\n\n🎣 Wait for the fish to bite!\n\n-# Patience is key to successful fishing!`,
					),
				);
			} else if (gamePhase === "caught" && caughtFish) {
				return new Container().addComponents(
					new TextDisplay().setContent(
						`# 🎣 Fishing Result\n\n**Player:** ${ctx.author.username}\n**New Balance:** ${player.balance} coins`,
					),
					new Separator(),
					new TextDisplay().setContent(
						`🎉 **You caught a ${caughtFish.fish.emoji} ${caughtFish.fish.name}!**\n\n**Catch Details:**\n• Type: ${caughtFish.fish.name}\n• Value: ${caughtFish.fish.price} coins\n• Rod Cost: ${rodPrice} coins\n\nThe ${caughtFish.fish.name} has been added to your inventory!\n\n-# Use \`/fishy inventory\` to see all your fish!`,
					),
				);
			}

			return new Container().addComponents(
				new TextDisplay().setContent("🎣 **Fishing completed!**"),
			);
		};

		const getActionButtons = (disabled = false) => {
			if (gamePhase === "fishing") {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("fishy_wait")
							.setEmoji("⏳")
							.setLabel("Fishing...")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(true),
					),
				];
			} else if (gamePhase === "caught") {
				return [
					new ActionRow<Button>().addComponents(
						new Button()
							.setCustomId("fishy_again")
							.setEmoji("🎣")
							.setLabel("Fish Again")
							.setStyle(ButtonStyle.Primary)
							.setDisabled(disabled || player.balance < rodPrice),
						new Button()
							.setCustomId("fishy_inventory")
							.setEmoji("📦")
							.setLabel("View Inventory")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(disabled),
					),
				];
			}

			return [];
		};

		// Start fishing animation
		const startFishing = async () => {
			fishingProgress = 0;
			fishingInterval = setInterval(async () => {
				fishingProgress += Math.random() * 15 + 5; // Random progress between 5-20%

				if (fishingProgress >= 100) {
					if (fishingInterval) clearInterval(fishingInterval);

					// Deduct rod cost and catch fish
					player.balance -= rodPrice;
					caughtFish = determineCatch();
					player.fishes = player.fishes || {};
					player.fishes[caughtFish.type] =
						(player.fishes[caughtFish.type] || 0) + 1;
					gamePhase = "caught";

					try {
						await ctx.editResponse({
							components: [getComponents(), ...getActionButtons()],
							flags: MessageFlags.IsComponentsV2,
						});
					} catch (error) {
						console.error("Error updating fishing result:", error);
					}
				} else {
					try {
						await ctx.editResponse({
							components: [getComponents(), ...getActionButtons()],
							flags: MessageFlags.IsComponentsV2,
						});
					} catch (error) {
						console.error("Error updating fishing progress:", error);
					}
				}
			}, 1000);
		};

		// Send initial message and start fishing
		const message = await ctx.write(
			{
				components: [getComponents(), ...getActionButtons()],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);

		await startFishing();

		// Collector for button interactions
		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				i.user.id === ctx.author.id && i.customId.startsWith("fishy_"),
			idle: 60000, // 1 minute
		});

		collector.run(/fishy_(.+)/, async (interaction: ComponentInteraction) => {
			const action = interaction.customId.split("_")[1];

			if (action === "again") {
				if (player.balance < rodPrice) {
					await interaction.write({
						content: `❌ **Not enough coins!** You need ${rodPrice} coins to fish again.`,
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				gamePhase = "fishing";
				caughtFish = null;

				await interaction.update({
					components: [getComponents(), ...getActionButtons()],
					flags: MessageFlags.IsComponentsV2,
				});

				await startFishing();
				return;
			}

			if (action === "inventory") {
				await this.showInventoryInModal(interaction, player);
				return;
			}
		});

		// Collector end: clean up
		collector.stop = async (reason: string) => {
			if (fishingInterval) clearInterval(fishingInterval);

			if (reason === "idle") {
				try {
					await ctx.editResponse({
						components: [getComponents(), ...getActionButtons(true)],
					});
				} catch (error) {
					console.error("Error updating message on collector end:", error);
				}
			}
		};
	}

	private async showInventory(
		ctx: CommandContext<typeof options>,
		player: PlayerData,
	) {
		const fishList = Object.entries(fishTypes)
			.map(([type, fish]) => {
				const count = player.fishes[type] || 0;
				const value = count * fish.price;
				return `**${fish.emoji} ${fish.name}** — ${count} (${value} coins)`;
			})
			.join("\n");

		const totalValue = Object.entries(player.fishes).reduce(
			(total, [type, count]) => {
				const fish = fishTypes[type as keyof typeof fishTypes];
				return total + (count as number) * fish.price;
			},
			0,
		);

		const components = new Container().addComponents(
			new TextDisplay().setContent(
				`# 📦 Fishy Inventory\n\n**Player:** ${ctx.author.username}\n**Balance:** ${player.balance} coins\n**Total Fish Value:** ${totalValue} coins`,
			),
			new Separator(),
			new TextDisplay().setContent(
				`**Your Fish Collection:**\n${fishList}\n\n**Commands:**\n• Use \`/fishy fish\` to go fishing\n• Use \`/fishy sell [type] [amount]\` to sell fish\n\n-# Fishing rod costs 10 coins per use`,
			),
		);

		await ctx.editOrReply({
			components: [components],
			flags: MessageFlags.IsComponentsV2,
		});
	}

	private async showInventoryInModal(
		interaction: ComponentInteraction,
		player: PlayerData,
	) {
		const fishList = Object.entries(fishTypes)
			.map(([type, fish]) => {
				const count = player.fishes[type] || 0;
				const value = count * fish.price;
				return `${fish.emoji} ${fish.name}: ${count} (${value} coins)`;
			})
			.join("\n");

		const totalValue = Object.entries(player.fishes).reduce(
			(total, [type, count]) => {
				const fish = fishTypes[type as keyof typeof fishTypes];
				return total + (count as number) * fish.price;
			},
			0,
		);

		await interaction.write({
			content: `📦 **Your Inventory:**\n\`\`\`\nBalance: ${player.balance} coins\nTotal Fish Value: ${totalValue} coins\n\n${fishList}\`\`\``,
			flags: MessageFlags.Ephemeral,
		});
	}

	private async handleSelling(
		ctx: CommandContext<typeof options>,
		player: PlayerData,
		fishType: string,
		amount: number,
	) {
		const fish = fishTypes[fishType as keyof typeof fishTypes];
		if (!fish) {
			await ctx.editOrReply({
				content: "❌ **Error:** Invalid fish type!",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const owned = player.fishes[fishType] || 0;
		if (owned === 0) {
			await ctx.editOrReply({
				content: `❌ **Error:** You don't have any ${fish.name} to sell!`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const sellAmount = Math.min(amount, owned);
		const totalPrice = sellAmount * fish.price;

		// Update player data
		player.fishes = player.fishes || {};
		player.fishes[fishType] = (player.fishes[fishType] || 0) - sellAmount;
		player.balance += totalPrice;

		const components = new Container().addComponents(
			new TextDisplay().setContent(
				`# 💰 Fish Sale\n\n**Player:** ${ctx.author.username}\n**New Balance:** ${player.balance} coins`,
			),
			new Separator(),
			new TextDisplay().setContent(
				`✅ **Sale Completed!**\n\nYou sold **${sellAmount}x ${fish.emoji} ${fish.name}** for **${totalPrice} coins**!\n\n**Remaining ${fish.name}:** ${player.fishes[fishType]}\n\n-# Use \`/fishy inventory\` to see your updated inventory`,
			),
		);

		await ctx.editOrReply({
			components: [components],
			flags: MessageFlags.IsComponentsV2,
		});
	}
}
