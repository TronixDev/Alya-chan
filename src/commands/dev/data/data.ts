import { AutoLoad, Command, Declare } from "seyfert";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "data",
	description: "Data management commands",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AlyaOptions({
	cooldown: 5,
	category: AlyaCategory.Developers,
	onlyDeveloper: true,
})
@AutoLoad()
export default class DatabaseCommand extends Command {}
