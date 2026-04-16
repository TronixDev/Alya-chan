import { AutoLoad, Command, Declare } from "seyfert";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "how",
	description: "Calculates how much of specified topic you are",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AlyaOptions({ category: AlyaCategory.Fun })
@AutoLoad()
export default class HowCommand extends Command {}
