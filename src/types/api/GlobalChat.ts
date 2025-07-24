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
