export interface GlobalChatGuild {
	id: string;
	global_channel_id: string;
	webhooks: Array<{ id: string; token: string }>;
	created_at?: string;
	updated_at?: string;
}

export interface FailedGuild {
	guildId: string;
	guildName: string;
	error: string;
}

export interface SuccessfulGuild {
	guildId: string;
	guildName: string;
	messageId: string;
}

export interface GlobalChatApiResponse {
	status: string;
	message?: string;
	code?: string;
	data?: {
		reason?: string;
		messageInfo?: {
			id: string;
			author: string;
			content: string;
			fromGuild: string;
			fromGuildName: string;
		};
		deliveryStats?: {
			total?: number;
			successRate?: number;
			successful?: number;
			failed?: number;
		};
		successfulGuilds?: SuccessfulGuild[];
		failedGuilds?: FailedGuild[];
	};
	error?: string;
}
export interface GlobalChatGuildInfoResponse {
	status: string;
	message?: string;
	data?: {
		guild?: {
			id: string;
			global_channel_id: string;
			created_at: string;
			updated_at: string;
		};
		webhook_ids?: string[];
		total_webhook?: number;
		registered: boolean;
	};
}
