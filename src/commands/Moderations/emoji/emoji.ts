import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "emoji",
	description: "Manage custom emojis in this server",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.emoji.name", "cmd.emoji.description")
@AlyaOptions({
	cooldown: 5,
	category: AlyaCategory.Moderations,
})
@AutoLoad()
export default class EmojiCommand extends Command {}
