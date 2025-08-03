import fs from "node:fs/promises";
import path from "node:path";

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
];

/**
 * Default language code
 */
export const DEFAULT_LANGUAGE = "en";

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
	// Check cache first
	const cached = modelCache.get(code);
	if (cached) {
		return cached;
	}

	const langInfo = getLanguageInfo(code);
	if (!langInfo) {
		console.error(`Language model not found for code: ${code}`);
		return null;
	}

	try {
		const modelPath = path.join(getModelsDirectory(), langInfo.filename);
		const content = await fs.readFile(modelPath, "utf8");

		// Cache the content
		modelCache.set(code, content);

		return content;
	} catch (error) {
		console.error(`Failed to load language model for ${code}:`, error);
		return null;
	}
}

/**
 * Load all language models into cache
 */
export async function preloadAllModels(): Promise<void> {
	const loadPromises = AVAILABLE_LANGUAGES.map(async (lang) => {
		try {
			await loadLanguageModel(lang.code);
			console.log(`✅ Loaded language model: ${lang.name} (${lang.code})`);
		} catch (error) {
			console.error(
				`❌ Failed to load language model: ${lang.name} (${lang.code})`,
				error,
			);
		}
	});

	await Promise.all(loadPromises);
	console.log(`🚀 Preloaded ${modelCache.size} language models`);
}

/**
 * Clear the model cache
 */
export function clearModelCache(): void {
	modelCache.clear();
	console.log("🧹 Language model cache cleared");
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

/**
 * Validate that all required model files exist
 */
export async function validateModelFiles(): Promise<{
	valid: boolean;
	missing: string[];
}> {
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

	return {
		valid: missing.length === 0,
		missing,
	};
}

// Export default functions for easier imports
export default {
	loadLanguageModel,
	preloadAllModels,
	clearModelCache,
	getCacheStats,
	reloadLanguageModel,
	validateModelFiles,
	isValidLanguage,
	getLanguageInfo,
	getAvailableLanguageCodes,
	getAvailableLanguages,
	AVAILABLE_LANGUAGES,
	DEFAULT_LANGUAGE,
};
