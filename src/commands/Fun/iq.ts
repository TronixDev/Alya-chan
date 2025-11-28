import {
	Command,
	type CommandContext,
	Container,
	createUserOption,
	Declare,
	Middlewares,
	Options,
	Separator,
	TextDisplay,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

const option = {
	user: createUserOption({
		description: "The user you want to check the IQ of",
		required: false,
	}),
};

@Declare({
	name: "iq",
	description: "Generates and provides the user's IQ",
	aliases: ["iq"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AlyaOptions({ category: AlyaCategory.Fun })
@Options(option)
@Middlewares([])
export default class IQCommand extends Command {
	async run(ctx: CommandContext<typeof option>) {
		const user = ctx.options.user || ctx.author;

		const minIQ = 2;
		const maxIQ = 300;
		const randomIQ = Math.floor(Math.random() * (maxIQ - minIQ + 1)) + minIQ;

		let message = `> ${user}'s IQ is **${randomIQ}**.`;
		let emoji = "🧠";

		if (randomIQ >= 80) {
			message = `> ${user}'s IQ is high **${randomIQ}**. You're a genius! 🧠`;
			emoji = "🧠";
		} else if (randomIQ <= 50) {
			message = `> ${user}'s IQ is low **${randomIQ}**. Keep learning and growing! 📚`;
			emoji = "📚";
		}

		const components = new Container().addComponents(
			new TextDisplay().setContent(
				`# ${emoji} IQ Test\n\n## > Checking IQ for ${user}\n\n**• IQ Level**\n${message}`,
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
