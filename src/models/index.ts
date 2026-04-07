import fs from "node:fs/promises";
import path from "node:path";
import { Logger } from "seyfert";

const logger = new Logger({
	name: "[Models]",
});

/**
 * Interface for language model configuration
 */
export interface LanguageModel {
	code: string;
	name: string;
	flag: string;
	filename: string;
	content?: string;
}

/**
 * Available language models for Alya chatbot
 */
export const AVAILABLE_LANGUAGES: LanguageModel[] = [
	{
		code: "id",
		name: "Indonesian",
		flag: "🇮🇩",
		filename: "alya-id.txt",
	},
	{
		code: "en",
		name: "English",
		flag: "🇺🇸",
		filename: "alya-en.txt",
	},
	{
		code: "auto",
		name: "Auto (Multi-language)",
		flag: "🌐",
		filename: "alya-multilang.txt",
	},
];

/**
 * Default language code
 */
export const DEFAULT_LANGUAGE = "auto";

/**
 * Language model cache to avoid reading files repeatedly
 */
const modelCache = new Map<string, string>();

/**
 * Get the directory path for model files
 */
function getModelsDirectory(): string {
	return path.resolve(process.cwd(), "models");
}

/**
 * Validate that all model files declared in AVAILABLE_LANGUAGES exist on disk
 */
export async function validateModelFiles(): Promise<{
	valid: boolean;
	missing: string[];
}> {
	try {
		logger.info("Validating language model files...");
	} catch {}

	const missing: string[] = [];
	const modelsDir = getModelsDirectory();

	for (const lang of AVAILABLE_LANGUAGES) {
		const modelPath = path.join(modelsDir, lang.filename);
		try {
			await fs.access(modelPath);
		} catch {
			missing.push(`${lang.name} (${lang.filename})`);
		}
	}

	if (missing.length > 0) {
		try {
			logger.warn("Some language model files are missing:", missing);
			logger.warn(
				"Bot will continue but some languages may not work properly.",
			);
		} catch {}
	}

	return { valid: missing.length === 0, missing };
}

/**
 * Check if a language code is valid
 */
export function isValidLanguage(code: string): boolean {
	return AVAILABLE_LANGUAGES.some((lang) => lang.code === code);
}

/**
 * Get language model information by code
 */
export function getLanguageInfo(code: string): LanguageModel | null {
	return AVAILABLE_LANGUAGES.find((lang) => lang.code === code) || null;
}

/**
 * Get all available language codes
 */
export function getAvailableLanguageCodes(): string[] {
	return AVAILABLE_LANGUAGES.map((lang) => lang.code);
}

/**
 * Get all available languages with their display information
 */
export function getAvailableLanguages(): {
	name: string;
	value: string;
	flag: string;
}[] {
	return AVAILABLE_LANGUAGES.map((lang) => ({
		name: `${lang.flag} ${lang.name}`,
		value: lang.code,
		flag: lang.flag,
	}));
}

/**
 * Load a specific language model content
 */
export async function loadLanguageModel(code: string): Promise<string | null> {
	const cached = modelCache.get(code);
	if (cached) {
		return cached;
	}

	const langInfo = getLanguageInfo(code);
	if (!langInfo) {
		logger.error(`[Models] Language not found for code: ${code}`);
		return null;
	}

	try {
		const modelPath = path.join(getModelsDirectory(), langInfo.filename);
		const content = await fs.readFile(modelPath, "utf8");

		modelCache.set(code, content);

		return content;
	} catch (error) {
		logger.error(`[Models] Failed to load model for ${code}:`, error);
		return null;
	}
}

/**
 * Load all language models into cache
 */
export async function preloadAllModels(): Promise<void> {
	try {
		logger.info("📚 Preloading language models...");
	} catch {}
	const loadPromises = AVAILABLE_LANGUAGES.map(async (lang) => {
		try {
			await loadLanguageModel(lang.code);
			logger.info(`[Models] Loaded model: ${lang.name} (${lang.code})`);
		} catch (error) {
			logger.error(
				`[Models] Failed to load model: ${lang.name} (${lang.code})`,
				error,
			);
		}
	});

	await Promise.all(loadPromises);
	logger.info(`[Models] Preloaded ${modelCache.size} models`);
}

/**
 * Clear the model cache
 */
export function clearModelCache(): void {
	modelCache.clear();
	logger.info("[Models] Language model cache cleared");
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; languages: string[] } {
	return {
		size: modelCache.size,
		languages: Array.from(modelCache.keys()),
	};
}

/**
 * Reload a specific language model (clear cache and reload)
 */
export async function reloadLanguageModel(
	code: string,
): Promise<string | null> {
	modelCache.delete(code);
	return await loadLanguageModel(code);
}

export default {
	loadLanguageModel,
	preloadAllModels,
	clearModelCache,
	getCacheStats,
	reloadLanguageModel,
	isValidLanguage,
	getLanguageInfo,
	getAvailableLanguageCodes,
	getAvailableLanguages,
	AVAILABLE_LANGUAGES,
	DEFAULT_LANGUAGE,
};
