import { AutoLoad, Command, Declare } from "seyfert";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "premium",
	description: "Premium user management commands",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AlyaOptions({
	cooldown: 5,
	category: AlyaCategory.Developers,
	onlyDeveloper: true,
})
@AutoLoad()
export default class PremiumCommand extends Command {}
