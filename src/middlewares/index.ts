import { checkCooldown } from "./commands/cooldown";
import { checkDevMode } from "./commands/devmode";
import {
	checkNodes,
	checkPlayer,
	checkQueue,
	checkTracks,
} from "./commands/manager";
import { checkPremium } from "./commands/premium";
import { checkVerifications } from "./commands/verifications";
import {
	checkBotVoiceChannel,
	checkVoiceChannel,
	checkVoicePermissions,
} from "./commands/voice";

export const AlyaMiddlewares = {
	// Main middlewares
	checkCooldown,
	checkVerifications,
	checkPremium,
	checkDevMode,

	// Voice middlewares
	checkBotVoiceChannel,
	checkVoiceChannel,

	// Manager middlewares
	checkQueue,
	checkNodes,
	checkPlayer,
	checkTracks,

	// Permissions middlewares
	checkVoicePermissions,
} as const;
