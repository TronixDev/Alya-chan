import {
	Command,
	type CommandContext,
	Container,
	Declare,
	MediaGallery,
	MediaGalleryItem,
	Middlewares,
	Options,
	Separator,
	TextDisplay,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "waifu",
	description:
		"Generates and displays a random anime-style female character image",
	aliases: ["waifu"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AlyaOptions({ category: AlyaCategory.Fun })
@Options({})
@Middlewares([])
export default class WaifuCommand extends Command {
	async run(ctx: CommandContext) {
		try {
			await ctx.deferReply();

			const waifuFetch = await fetch("https://api.waifu.pics/sfw/waifu", {
				headers: { Accept: "application/json" },
			});

			if (!waifuFetch.ok) {
				throw new Error(`API request failed with status ${waifuFetch.status}`);
			}

			const waifuData = await waifuFetch.json();
			const waifuImage = waifuData.url;

			const components = new Container().addComponents(
				new TextDisplay().setContent(`# Alya-chan`),
				new MediaGallery().addItems(
					new MediaGalleryItem()
						.setMedia(waifuImage)
						.setDescription(`Here's your waifu!`),
				),
				new Separator(),
				new TextDisplay().setContent(`Requested by ${ctx.author.username}`),
			);

			await ctx.editOrReply({
				components: [components],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			console.error("Error in waifu command:", error);
			const errorComponents = new Container().addComponents(
				new TextDisplay().setContent(
					`❌ **Error**\n\nOops! Something went wrong while fetching your waifu. Please try again later.`,
				),
				new Separator(),
				new TextDisplay().setContent(`Requested by ${ctx.author.username}`),
			);
			await ctx.editOrReply({
				components: [errorComponents],
				flags: MessageFlags.IsComponentsV2,
			});
		}
	}
}
