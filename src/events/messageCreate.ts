import { createEvent } from "seyfert";
import { handleChatbotMessage, handleGlobalChatMessage_v2 } from "#alya/utils";

export default createEvent({
	data: { name: "messageCreate" },
	async run(message, client) {
		await handleChatbotMessage(message, client);
		await handleGlobalChatMessage_v2(message, client);
	},
});
