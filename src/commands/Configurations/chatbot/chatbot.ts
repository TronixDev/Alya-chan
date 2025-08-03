import { AutoLoad, Command, Declare } from "seyfert";
import { AlyaOptions } from "#alya/utils";
import { AlyaCategory } from "#alya/types";

@Declare({
	name: "chatbot",
	description: "Setup or remove a chatbot",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@AutoLoad()
// @LocalesT("cmd.setup.name", "cmd.setup.description")
@AlyaOptions({ cooldown: 10, category: AlyaCategory.Configurations })
export default class ChatbotCommand extends Command {}
