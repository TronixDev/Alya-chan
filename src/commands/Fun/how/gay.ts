import {
	Declare,
	type CommandContext,
	SubCommand,
	Options,
	createUserOption,
	Container,
	Separator,
	TextDisplay,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

const options = {
	user: createUserOption({
		description: "Specified user's percentage will be displayed",
		required: false,
	}),
};

@Declare({
	name: "gay",
	description: "Shows how gay you are, results are accurate",
})
@Options(options)
export default class HowGayCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>) {
		const target = ctx.options.user || ctx.author;
		const randomizer = Math.floor(Math.random() * 101);

		const components = new Container().addComponents(
			new TextDisplay().setContent(
				`# 🌈 How Gay Tool\n\n## > How gay is ${target.username}?\n\n**• Percentage**\n> ${target} is ${randomizer}% **gay** 🍆`,
			),

			new Separator(),

			new TextDisplay().setContent(`-# Requested by ${ctx.author.username}`),
		);

		await ctx.editOrReply({
			components: [components],
			flags: MessageFlags.IsComponentsV2,
		});
	}
}
