import type { KyResponse } from "ky";
import ky from "ky";
import { Embed } from "seyfert";
import type Alya from "#alya/client";
import { Configuration } from "#alya/config";

/**
 * Send error log to webhook
 * @param client - The client instance
 * @param error - The error object
 * @param context - Additional context information
 * @returns Webhook HTTP response from ky.
 */
export async function sendErrorLog(
	client: Alya,
	error: Error,
	context?: string,
): Promise<KyResponse> {
	const fields = [
		{
			name: "Error Name",
			value: error.name,
			inline: true,
		},
		{
			name: "Timestamp",
			value: new Date().toISOString(),
			inline: true,
		},
	];

	if (context) {
		fields.push({
			name: "Context",
			value: context,
			inline: false,
		});
	}

	const embed = new Embed()
		.setColor(Configuration.color.no)
		.setTitle("❌ Error Occurred")
		.setDescription(
			`\`\`\`\n${error.stack?.slice(0, 4000) ?? error.message}\`\`\``,
		)
		.addFields(fields)
		.setTimestamp();

	return ky.post(`${client.config.webhooks.errorLog}?wait=true`, {
		headers: {
			"Content-Type": "application/json",
		},
		json: {
			username: "Alya Error Logger",
			avatar_url: client.me.avatarURL(),
			embeds: [embed.toJSON()],
		},
		throwHttpErrors: false,
	});
}
