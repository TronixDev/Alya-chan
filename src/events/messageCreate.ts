import { createEvent } from "seyfert";
import { handleChatbotMessage } from "#alya/utils";
import { handleGlobalChatMessage } from "../utils/Common/GlobalChatHandler";

export default createEvent({
	data: { name: "messageCreate" },
	async run(message, client) {
		await handleChatbotMessage(message, client);
		await handleGlobalChatMessage(message, client);
	},
});
