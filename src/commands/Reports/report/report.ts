import { AutoLoad, Command, Declare } from "seyfert";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "report",
	description: "Report a bugs, users or suggestions",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AlyaOptions({ cooldown: 5, category: AlyaCategory.Reports })
@AutoLoad()
export default class ReportCommand extends Command {}
