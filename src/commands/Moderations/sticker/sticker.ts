import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "sticker",
	description: "Manage custom stickers in this server",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.sticker.name", "cmd.sticker.description")
@AlyaOptions({
	cooldown: 5,
	category: AlyaCategory.Moderations,
})
@AutoLoad()
export default class StickerCommand extends Command {}
