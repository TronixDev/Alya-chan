import type { Command, ContextMenuCommand, SubCommand } from "seyfert";
import type { PermissionFlagsBits } from "seyfert/lib/types";

export type PermissionNames = keyof typeof PermissionFlagsBits;
export type AutoplayMode = "enabled" | "disabled";
export type PausedMode = "pause" | "resume";
export type NonGlobalCommands = Command | ContextMenuCommand | SubCommand;

export * from "./api/DnsProviders";
export * from "./api/GlobalChat";
export * from "./api/Options";
export * from "./api/Recommendation";
export * from "./core/Category";
export * from "./core/Configuration";
export * from "./core/Emoji";
export * from "./core/Keys";
export * from "./db/ChatbotSetup";
export * from "./lavalink/Lavalink";
export * from "./lavalink/PlayerSaver";
