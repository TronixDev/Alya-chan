import { LavalinkEventTypes } from "#alya/types";
import { createLavalinkEvent } from "#alya/utils";

export default createLavalinkEvent({
	name: "debug",
	type: LavalinkEventTypes.Manager,
	run(client, message: unknown) {
		client.logger.info("Lavalink debug event received:", message);
	},
});
