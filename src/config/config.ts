import type { AlyaConfiguration, AlyaEnvironment } from "#alya/types";
import { emoji } from "./emoji";

const { TOKEN, DATABASE_URL, DATABASE_PASSWORD } = Bun.env;

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
		webhookAuth: "S6:<&ZhpQT}ZJ&coHZ4|;M7T3!V6OkoupD7Qz!##", // Replace with actual webhook auth token
		token:
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExNjgzODUzNzEyOTQ0MjA5OTIiLCJib3QiOnRydWUsImlhdCI6MTczMjMzNDMwMX0.ZaliaLH24inHJERiHxfjXHzGKXSPj6sFhruFJSNwf-A", // Replace with actual Top.gg token
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
		enabled: true, // Enable or disable global chat feature
		apiUrl: "http://45.142.114.113:20011", // URL of the global chat API
		webhookName: "Alya Global Chat", // Name of the webhook for global chat
		apiKey: "your_api_key_here", // API key (will be sent as `Authorization: Bearer <apiKey>`)
	},
	chatbot: {
		enabled: true, // Enable or disable chatbot feature
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
		nodeLog:
			"https://discord.com/api/webhooks/1401512597584613468/EdVyjbAMxzY-qrEglcc3HEPCrueEWZrjYMQcrm5KvHbs39fVJ__lTEOdDt5-2E_HahXK", // Node logs
		guildLog:
			"https://discord.com/api/webhooks/1401512718334300261/taXpaSJKGR5eA4rCdJMPqWw3ZI0Rw5jIWSe_d3ulGDLtOYaIt9re-7PH7croa4xQQnRd", // Guild logs
		commandLog:
			"https://discord.com/api/webhooks/1401512867143880814/9VewQZT0fCO3dzuaotEgUi33mNJpduS6aj4mdO_7Tw8plj_x92MScYybSw-Ml92054BF", // Command logs
		voteLog:
			"https://discord.com/api/webhooks/1260482354535989259/LE4VUln4eUaaE_pTzU8IkU1lFQS_mn24f2C8OpBosCVkWETTO1oFiDyIgfWnJ8BqTD4s", // Vote logs
		errorLog:
			"https://discord.com/api/webhooks/1325337504114540616/nHrtD-_-JDyPlQm_LRdAaC2p6-gM_38yvU2WjicBwz06vYAcPNfjS0ujGvOmLjuyLdpk", // Error logs
		report:
			"https://discord.com/api/webhooks/1401513297131601973/qlM-Z_LcS1UN1McvhtYUR-MSBN0dBeLn_JOAYW84v5JJISvN6Gxwnqv_oWDhJpjiKYNC", // Bug or suggestion reports
	},

	emoji,
};

export const Environment: AlyaEnvironment = {
	Token: TOKEN,
	DatabaseUrl: DATABASE_URL,
	DatabasePassword: DATABASE_PASSWORD,
};

export * from "./nodes";
export * from "./emoji";
