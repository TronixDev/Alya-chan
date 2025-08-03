import {
	Declare,
	type CommandContext,
	SubCommand,
	Options,
	createIntegerOption,
	Container,
	TextDisplay,
	Separator,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

const options = {
	sides: createIntegerOption({
		description: "Number of sides on the dice (default: 6)",
		required: false,
		min_value: 2,
		max_value: 100,
	}),
	count: createIntegerOption({
		description: "Number of dice to roll (default: 1)",
		required: false,
		min_value: 1,
		max_value: 10,
	}),
};

@Declare({
	name: "dice",
	description: "Roll dice with customizable sides and count",
})
@Options(options)
export default class DiceCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>) {
		const sides = ctx.options.sides ?? 6;
		const count = ctx.options.count ?? 1;

		const rolls: number[] = [];
		for (let i = 0; i < count; i++) {
			rolls.push(Math.floor(Math.random() * sides) + 1);
		}

		const total = rolls.reduce((sum, roll) => sum + roll, 0);
		const rollsText = rolls
			.map((roll, index) => `🎲 **Dice ${index + 1}:** ${roll}`)
			.join("\n");

		const components = new Container().addComponents(
			new TextDisplay().setContent(
				`# 🎲 Dice Roll\n\n**Rolling ${count} ${sides}-sided dice:**\n\n${rollsText}\n\n**Total:** ${total}`,
			),

			new Separator(),

			new TextDisplay().setContent(`-# Requested by ${ctx.author.username}`),
		);

		// Send initial message
		await ctx.editOrReply(
			{
				components: [components],
				flags: MessageFlags.IsComponentsV2,
			},
			true,
		);
	}
}
