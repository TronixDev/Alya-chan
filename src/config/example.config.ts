/**
 * Example configuration file.
 * Rename this file to config.ts and fill the values.
 * Fill the values with your own values here.
 */

import type { AlyaConfiguration, AlyaEnvironment } from "#alya/types";
import { emoji } from "./emoji";

const { TOKEN, DATABASE_URL, DATABASE_PASSWORD, OPENROUTER, LASTFM } =
	process.env;

export const Configuration: AlyaConfiguration = {
	defaultPrefix: "a!", // Default prefix for commands
	defaultSearchPlatform: "spotify", // Default search platform for music commands
	defaultVolume: 60, // Default volume level for music playback
	defaultLocale: "en-US", // Default locale for the bot
	lyricsLines: 11, // Number of lyrics lines to display
	serverPort: 4000, // Port for the API server
	info: {
		banner: "https://i.ibb.co.com/hrpKCdy/e1da98e96fdfc12635909f99725d971e.png", // Replace with actual banner URL
		inviteLink:
			"https://discord.com/oauth2/authorize?client_id=1260252174861074442",
		supportServer: "https://discord.gg/pTbFUFdppU",
		voteLink: "https://top.gg/bot/1260252174861074442/vote",
	},
	topgg: {
		enabled: false,
		webhookAuth: "xxxxx", // Replace with actual webhook auth token
		token: "xxxxx", // Replace with actual Top.gg token
	},
	premium: {
		enabled: false, // Enable or disable premium features
	},
	cache: {
		filename: "commands.json", // Name of the cache file
		size: 5, // Size of the cache
	},
	developersIds: ["885731228874051624", "169711695932030976"], // Replace with actual developer IDs
	globalChat: {
		// *Internal use only
		enabled: false, // Enable or disable global chat feature
		apiUrl: "http://example.com", // URL of the global chat API
		webhookName: "Alya Global Chat", // Name of the webhook for global chat
		apiKey: "your_api_key_here", // API key (will be sent as `Authorization: Bearer <apiKey>`)
	},
	chatbot: {
		enabled: false, // Enable or disable chatbot feature
	},
	permissions: {
		stagePermissions: ["MuteMembers"],
		voicePermissions: ["ViewChannel", "Connect", "Speak"],
	},
	color: {
		primary: 0x5865f2, // Primary color for embeds
		secondary: 0x00ff00, // Secondary color for embeds

		yes: 0x00ff33, // Color for positive responses
		no: 0xff0000, // Color for negative responses
		warn: 0xffff00, // Color for warning responses
	},
	webhooks: {
		nodeLog: "https://discord.com/api/webhooks/xxxxx/xxxxx", // Node logs
		guildLog: "https://discord.com/api/webhooks/xxxxx/xxxxx", // Guild logs
		commandLog: "https://discord.com/api/webhooks/xxxxx/xxxxx", // Command logs
		voteLog: "https://discord.com/api/webhooks/xxxxx/xxxxx", // Vote logs
		errorLog: "https://discord.com/api/webhooks/xxxxx/xxxxx", // Error logs
		report: "https://discord.com/api/webhooks/xxxxx/xxxxx", // Bug or suggestion reports
	},

	emoji,
};

export const Environment: AlyaEnvironment = {
	Token: TOKEN,
	DatabaseUrl: DATABASE_URL,
	DatabasePassword: DATABASE_PASSWORD,
	OpenRouter: OPENROUTER,
	LastFM: LASTFM,
};

export * from "./emoji";
export * from "./nodes";
