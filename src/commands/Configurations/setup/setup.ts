import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { AlyaOptions } from "#alya/utils";
import { AlyaCategory } from "#alya/types";

@Declare({
	name: "setup",
	description: "Setup or remove a music request channels",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@AutoLoad()
@LocalesT("cmd.setup.name", "cmd.setup.description")
@AlyaOptions({ cooldown: 10, category: AlyaCategory.Configurations })
export default class SetupCommand extends Command {}
