import { createEvent } from "seyfert";
import { handleChatbotMessage, handleGlobalChat } from "#alya/utils";

export default createEvent({
	data: { name: "messageCreate" },
	async run(message, client) {
		await handleChatbotMessage(message, client);
		await handleGlobalChat(message, client);
	},
});
