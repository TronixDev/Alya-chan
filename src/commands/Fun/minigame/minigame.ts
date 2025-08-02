import { AutoLoad, Command, Declare } from "seyfert";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "minigame",
	description: "Play some minigames!",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AlyaOptions({ category: AlyaCategory.Fun })
@AutoLoad()
export default class MinigameCommand extends Command {}
