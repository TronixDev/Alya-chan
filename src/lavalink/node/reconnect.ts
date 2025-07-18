import { LavalinkEventTypes } from "#alya/types";
import { createLavalinkEvent, sendNodeLog } from "#alya/utils";

export default createLavalinkEvent({
	name: "reconnecting",
	type: LavalinkEventTypes.Node,
	async run(client, node) {
		client.logger.info(`[Music] Node ${node.id} Reconnecting...`);
		await sendNodeLog(client, "reconnecting", node).catch((err) =>
			client.logger.error(
				`[Music] Failed to send node reconnect webhook: ${err}`,
			),
		);
	},
});
