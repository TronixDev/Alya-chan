import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "globalchat",
	description: "Configure global chat settings",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@AutoLoad()
@LocalesT("cmd.globalchat.name", "cmd.globalchat.description")
@AlyaOptions({ cooldown: 10, category: AlyaCategory.Configurations })
export default class GlobalChatCommand extends Command {}
