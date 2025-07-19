import {
	Declare,
	Command,
	type CommandContext,
	createStringOption,
	createUserOption,
	Options,
	Embed,
	Middlewares,
	LocalesT,
} from "seyfert";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

const option = {
	tweet: createStringOption({
		description: "Tweet comment",
		required: true,
		// locales: {
		// 	name: "cmd.faketweet.options.tweet.name",
		// 	description: "cmd.faketweet.options.tweet.description",
		// },
	}),
	user: createUserOption({
		description: "Choose a user",
		required: false,
		// locales: {
		// 	name: "cmd.faketweet.options.user.name",
		// 	description: "cmd.faketweet.options.user.description",
		// },
	}),
};

@Declare({
	name: "fake-tweet",
	description: "Make users tweet something ;)",
	aliases: ["fake-tweet"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
// @LocalesT("cmd.faketweet.name", "cmd.faketweet.description")
@AlyaOptions({ category: AlyaCategory.Fun })
@Options(option)
@Middlewares([])
export default class FakeTweetCommand extends Command {
	async run(ctx: CommandContext<typeof option>) {
		const { client, options } = ctx;
		const tweet = options.tweet;

		const user = options.user || ctx.author;
		const avatarUrl = user.avatarURL?.({ extension: "jpg" }) ?? "";
		const canvas = `https://some-random-api.com/canvas/tweet?avatar=${avatarUrl}&displayname=${encodeURIComponent(user.globalName ?? user.username)}&username=${encodeURIComponent(user.username)}&comment=${encodeURIComponent(tweet)}`;

		const embed = new Embed()
			.setTitle(`${user.globalName ?? user.username}'s Tweet`)
			.setImage(canvas)
			.setColor(client.config.color.primary)
			.setFooter({ text: `Requested by ${ctx.author.username}` });

		await ctx.editOrReply({ embeds: [embed] });
	}
}
