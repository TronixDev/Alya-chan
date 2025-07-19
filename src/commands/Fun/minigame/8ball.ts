import {
	Declare,
	type CommandContext,
	SubCommand,
	Options,
	createStringOption,
	Container,
	TextDisplay,
	Separator,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

const options = {
	question: createStringOption({
		description: "Your question for the 8ball",
		required: true,
	}),
};

@Declare({
	name: "8ball",
	description: "Ask the 8ball something",
})
@Options(options)
export default class EightBallCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>) {
		const question = ctx.options.question;
		const choices = [
			"🎱| It is certain.",
			"🎱| It is decidedly so.",
			"🎱| Without a doubt.",
			"🎱| Yes definitely.",
			"🎱| You may rely on it.",
			"🎱| As I see it, yes.",
			"🎱| Most likely.",
			"🎱| Outlook good.",
			"🎱| Yes.",
			"🎱| Signs point to yes.",
			"🎱| Reply hazy, try again.",
			"🎱| Ask again later.",
			"🎱| Better not tell you now.",
			"🎱| Cannot predict now.",
			"🎱| Concentrate and ask again.",
			"🎱| Don't count on it.",
			"🎱| My reply is no.",
			"🎱| My sources say no.",
			"🎱| Outlook not so good.",
			"🎱| Very doubtful.",
		];

		const ball = Math.floor(Math.random() * choices.length);
		const answer = choices[ball];

		const components = new Container().addComponents(
			new TextDisplay().setContent(
				`# 🎱 ${ctx.author.username}'s 8ball Game 🎱\n\n**Question:**\n> ${question}\n\n**Answer:**\n> ${answer}`,
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
