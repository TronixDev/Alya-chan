export interface GlobalChatGuild {
	id: string;
	globalChannelId: string;
	webhookId?: string;
	webhookToken?: string;
}

export interface FailedGuild {
	guildId: string;
	guildName: string;
	error: string;
}

export interface GlobalChatApiResponse {
	status: string;
	data?: {
		reason?: string;
		deliveryStats?: {
			total?: number;
			successRate?: number;
			successful?: number;
		};
		failedGuilds?: FailedGuild[];
	};
}
