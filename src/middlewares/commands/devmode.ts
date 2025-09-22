import { createMiddleware } from "seyfert";
import { MessageFlags } from "seyfert/lib/types";

/**
 * Check if devmode is enabled and restrict access to non-developers.
 */
export const checkDevMode = createMiddleware<void>(
	async ({ context, pass, next }) => {
		try {
			const { client, author, command } = context;
			const { developersIds } = client.config;

			// Always allow the devmode command itself for developers
			if (command && "name" in command && command.name === "devmode") {
				return next();
			}

			// Check if devmode is enabled through client alyaCache
			const isDevModeEnabled = client.alyaCache.isDevModeEnabled() ?? false;

			// If devmode is not enabled, allow all commands
			if (!isDevModeEnabled) {
				return next();
			}

			// If devmode is enabled, only allow developers
			if (!developersIds.includes(author.id)) {
				await context.editOrReply({
					flags: MessageFlags.Ephemeral,
					embeds: [
						{
							description: `${client.config.emoji.no} 🔒 Bot is currently in developer mode. Only developers can use commands.`,
							color: client.config.color.no,
						},
					],
				});

				return pass();
			}

			return next();
		} catch (error) {
			context.client.logger.error(`[Middleware checkDevMode] ${error}`);
			return pass();
		}
	},
);
