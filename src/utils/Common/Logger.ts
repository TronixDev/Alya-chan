import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Logger } from "seyfert";
import {
	LogLevels,
	gray,
	italic,
	red,
	rgb24,
	yellow,
} from "seyfert/lib/common";
import { Configuration } from "#alya/config";

type ColorFunction = (text: string) => string;

/**
 *
 * Custom color function.
 * @param text The text.
 * @returns
 */
const customColor: ColorFunction = (text: string) =>
	rgb24(text, Configuration.color.primary);

/**
 *
 * Add padding to the label.
 * @param label The label.
 * @returns
 */
function addPadding(label: string): string {
	const maxLength = 6;
	const bar = ">>";

	const spacesToAdd = maxLength - label.length;
	if (spacesToAdd <= 0) return bar;

	const spaces = " ".repeat(spacesToAdd);

	return spaces + bar;
}

/**
 * Formats memory usage data into a string.
 * @param data The memory usage data.
 * @returns
 */
function formatMemoryUsage(bytes: number): string {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let i = 0;
	let value = bytes;

	while (value >= 1024 && i < units.length - 1) {
		value /= 1024;
		i++;
	}

	return `[RAM: ${value.toFixed(2)} ${units[i]}]`;
}

/**
 *
 * Send ascii text.
 * @returns
 */
export function getWatermark(): void {
	const logoPath = join(process.cwd(), "src", "utils", "Common", "logo.txt");
	const logo = readFileSync(logoPath, "utf-8");

	console.info(
		customColor(`

${logo}
                                                           
        
           ${italic(`→   ${getRandomText()}`)}
    `),
	);
}

/**
 *
 * Get a random text to make it more lively...?
 * @returns
 */
function getRandomText(): string {
	const texts = [
		"Let the music play~",
		"Alya's melody magic!",
		"Rhythm and beats with Alya!",
		"Your musical companion!",
		"Dropping beats with style!",
		"Alya's harmony helper!",
		"Music to your ears!",
		"Alya's sound sanctuary!",
		"Vibing with Alya!",
		"Your DJ assistant!",
		"Alya's musical magic!",
		"Bringing the beats!",
		"Alya's sound waves!",
		"Music made easy!",
		"Harmony with Alya!",
		"Beats from the heart!",
		"Alya's rhythm realm!",
		"Musical help, Alya way!",
		"Express your sound!",
		"Alya's musical aid!",
		"Melodies for everyone!",
		"Alya's smooth tunes!",
		"Musical support, Alya style!",
		"Discord's best DJ!",
		"Musical aid from Alya!",
		"Rhythm express!",
		"Alya's musical care!",
		"Support with a beat!",
		"Alya's playlist power!",
		"Musical help, Alya touch!",
		"Help from the beats!",
	];

	return texts[Math.floor(Math.random() * texts.length)] ?? "";
}

/**
 *
 * Customize the Logger.
 * @param _this The logger itself.
 * @param level The log level.
 * @param args The log arguments.
 * @returns
 */
export function AlyaLogger(
	_this: Logger,
	level: LogLevels,
	args: unknown[],
): unknown[] {
	const date: Date = new Date();
	const memory: NodeJS.MemoryUsage = process.memoryUsage();

	const label: string = Logger.prefixes.get(level) ?? "Unknown";
	const timeFormat: string = `[${date.toLocaleDateString()} : ${date.toLocaleTimeString()}]`;

	const emojis: Record<LogLevels, string> = {
		[LogLevels.Debug]: "🐛",
		[LogLevels.Error]: "🚫",
		[LogLevels.Info]: "ℹ️",
		[LogLevels.Warn]: "⚠️",
		[LogLevels.Fatal]: "💀",
	};

	const colors: Record<LogLevels, ColorFunction> = {
		[LogLevels.Debug]: gray,
		[LogLevels.Error]: red,
		[LogLevels.Info]: customColor,
		[LogLevels.Warn]: yellow,
		[LogLevels.Fatal]: red,
	};

	const text = `${gray(`${timeFormat}`)} ${gray(formatMemoryUsage(memory.rss))} ${gray("[Alya]")} ${emojis[level]} [${colors[
		level
	](label)}] ${addPadding(label)}`;

	return [text, ...args];
}

Logger.customize(AlyaLogger);

/**
 * The logger instance.
 */
export const logger = new Logger({
	name: "[Alya]",
	saveOnFile: false,
	active: true,
});
