import type {
	AnyContext,
	Command,
	CommandContext,
	ContextMenuCommand,
	MenuCommandContext,
	MessageCommandInteraction,
	OnOptionsReturnObject,
	PermissionStrings,
	SubCommand,
	UserCommandInteraction,
	UsingClient,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common";
import { MessageFlags } from "seyfert/lib/types";

/** Context for user/message context-menu commands when paired with chat command handlers. */
type DefaultMenuCommandContext = MenuCommandContext<
	UserCommandInteraction | MessageCommandInteraction,
	never
>;

/**
 * Builds a short label for logs (group/subcommand when present).
 *
 * @param command - Resolved command or subcommand instance.
 * @returns Dot- or slash-style name, e.g. `group/subname` or `ban`.
 */
function commandLogName(
	command: Command | SubCommand | ContextMenuCommand,
): string {
	if ("group" in command && command.group) {
		return `${command.group}/${command.name}`;
	}
	return command.name;
}

/**
 * Formats Discord permission flags for log lines and embeds.
 *
 * @param permissions - Permission names or raw bit values from Seyfert.
 * @returns Comma-separated string representation.
 */
function formatPermissions(permissions: PermissionStrings): string {
	return permissions.map((p) => String(p)).join(", ");
}

/**
 * Default handler when a command or component `run` throws.
 * Used by `commands.defaults` and `components.defaults` in the client.
 *
 * @param ctx - Any interaction context (`AnyContext`: slash, menu, component, modal, …).
 * @param error - The thrown value or rejection reason.
 * @returns Result of `editOrReply` (ephemeral error embed).
 */
export async function onRunError(ctx: AnyContext, error: unknown) {
	ctx.client.logger.error(error);

	const { event } = await ctx.getLocale();

	return ctx.editOrReply({
		flags: MessageFlags.Ephemeral,
		embeds: [
			{
				description: `${ctx.client.config.emoji.no} ${event.overrides.error}`,
				color: EmbedColors.Red,
			},
		],
	});
}

/**
 * User lacks `defaultMemberPermissions` (or equivalent) for this chat command.
 * Seyfert hook: `Command["onPermissionsFail"]`.
 *
 * @param context - Chat command context (slash / prefix pipeline).
 * @param permissions - Permissions the member is missing.
 * @returns Result of `editOrReply` (ephemeral embed + log).
 */
export async function onPermissionsFail(
	context: CommandContext,
	permissions: PermissionStrings,
): Promise<unknown> {
	const { client, author, command } = context;
	const perms = formatPermissions(permissions);
	const label = commandLogName(command);

	client.logger.warn(
		`[onPermissionsFail] ${label} | user=${author.id} | missing=${perms}`,
	);

	const { event } = await context.getLocale();

	return context.editOrReply({
		flags: MessageFlags.Ephemeral,
		allowed_mentions: { parse: [] },
		embeds: [
			{
				title: event.overrides.missing_perms,
				description: `${client.config.emoji.no} ${event.overrides.missing_user_perms}\n\`${perms}\``,
				color: client.config.color.no ?? EmbedColors.Red,
			},
		],
	});
}

/**
 * Bot lacks guild/channel permissions required by the command (`botPermissions`).
 * Seyfert hook: `BaseClientOptions["commands"]["defaults"]["onBotPermissionsFail"]`.
 *
 * @param context - Chat or context-menu command context.
 * @param permissions - Permissions the bot is missing.
 * @returns Result of `editOrReply` (ephemeral embed + log).
 */
export async function onBotPermissionsFail(
	context: CommandContext | DefaultMenuCommandContext,
	permissions: PermissionStrings,
): Promise<unknown> {
	const { client, author, command } = context;
	const perms = formatPermissions(permissions);
	const label = commandLogName(command);

	client.logger.warn(
		`[onBotPermissionsFail] ${label} | user=${author.id} | bot_missing=${perms}`,
	);

	const { event } = await context.getLocale();

	return context.editOrReply({
		flags: MessageFlags.Ephemeral,
		allowed_mentions: { parse: [] },
		embeds: [
			{
				title: event.overrides.missing_perms,
				description: `${client.config.emoji.no} ${event.overrides.missing_bot_perms}\n\`${perms}\``,
				color: client.config.color.no ?? EmbedColors.Red,
			},
		],
	});
}

/**
 * Framework/internal failure while resolving or running a command (often no user-facing reply).
 * Seyfert hook: `BaseClientOptions["commands"]["defaults"]["onInternalError"]`.
 *
 * @param client - The Seyfert client instance.
 * @param command - Command, subcommand, or context-menu command being executed.
 * @param error - Optional underlying error; logged when present.
 * @returns `undefined` after logging (satisfies `unknown` contract for defaults).
 */
export function onInternalError(
	client: UsingClient,
	command: Command | SubCommand | ContextMenuCommand,
	error?: unknown,
): unknown {
	const label = commandLogName(command);
	void client.logger.error(
		`[onInternalError] ${label}`,
		error ?? "(no error object)",
	);
	return undefined;
}

/**
 * A global command middleware called `pass(message)` with a string (blocked path).
 * Seyfert hook: `BaseClientOptions["commands"]["defaults"]["onMiddlewaresError"]`.
 *
 * @param context - Chat or context-menu command context.
 * @param error - Message passed from middleware (shown to the user).
 * @returns Result of `editOrReply` (ephemeral embed + log).
 */
export async function onMiddlewaresError(
	context: CommandContext | DefaultMenuCommandContext,
	error: string,
): Promise<unknown> {
	const { client, author, command } = context;
	const label = commandLogName(command);

	client.logger.warn(
		`[onMiddlewaresError] ${label} | user=${author.id} | ${error}`,
	);

	return context.editOrReply({
		flags: MessageFlags.Ephemeral,
		allowed_mentions: { parse: [] },
		embeds: [
			{
				description: `${client.config.emoji.no} ${error}`,
				color: client.config.color.warn ?? EmbedColors.Yellow,
			},
		],
	});
}

/**
 * Slash or message command option validation failed (type, range, required, etc.).
 * Seyfert hook: `Command["onOptionsError"]`.
 *
 * @param context - Chat command context.
 * @param metadata - Per-option parse results (`failed`, `value`, optional `parseError`).
 * @returns Result of `editOrReply` (ephemeral embed + log).
 */
export async function onOptionsError(
	context: CommandContext,
	metadata: OnOptionsReturnObject,
): Promise<unknown> {
	const { client, author, command } = context;
	const label = commandLogName(command);

	const lines: string[] = [];
	for (const [name, meta] of Object.entries(metadata)) {
		if (meta.failed) {
			lines.push(`**${name}**: ${meta.value}`);
		}
	}

	client.logger.warn(
		`[onOptionsError] ${label} | user=${author.id} | ${lines.join(" | ") || "(no details)"}`,
	);

	const { event } = await context.getLocale();
	const header = event.overrides.invalid_command["1"];
	const body =
		lines.length > 0
			? `${header}\n${lines.join("\n")}`
			: `${header}\n${event.overrides.error}`;

	return context.editOrReply({
		flags: MessageFlags.Ephemeral,
		allowed_mentions: { parse: [] },
		embeds: [
			{
				title: event.overrides.invalid_options,
				description: `${client.config.emoji.no} ${body}`,
				color: client.config.color.no ?? EmbedColors.Red,
			},
		],
	});
}
