import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

@Declare({
	name: "chatbot",
	description: "Configure chatbot settings",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@AutoLoad()
@LocalesT("cmd.chatbot.name", "cmd.chatbot.description")
@AlyaOptions({ cooldown: 10, category: AlyaCategory.Configurations })
export default class ChatbotCommand extends Command {}
