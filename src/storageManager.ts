/**
 * ElevenLabs Text-to-Speech for VSCode
 * Copyright(C) 2025 Tobias Lekman
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 * For feature requests, and FAQs, please visit:
 * https://github.com/lekman/tts-code
 */

import * as vscode from "vscode";

interface CacheEntry {
	key: string;
	size: number;
	lastAccessed: number;
	uri: vscode.Uri;
}

/**
 * Manages file operations, caching, and audio export for the TTS extension.
 */
export class StorageManager {
	private cacheMetadata: Map<string, CacheEntry> = new Map();
	private cacheSize: number = 0;
	private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB

	/**
	 * Creates a new StorageManager instance.
	 * @param {vscode.ExtensionContext} context - The VSCode extension context for accessing storage locations.
	 */
	constructor(private readonly context: vscode.ExtensionContext) {
		this.initializeCache();
	}

	/**
	 * Retrieves audio data from the cache by key.
	 * @param {string} key - The cache key for the audio data.
	 * @returns {Promise<Buffer | undefined>} The cached audio data, or undefined if not found.
	 */
	public async getAudioCache(key: string): Promise<Buffer | undefined> {
		const entry = this.cacheMetadata.get(key);
		if (!entry) {
			return undefined;
		}

		try {
			// Update last accessed time
			entry.lastAccessed = Date.now();
			this.cacheMetadata.set(key, entry);

			// Read the cached file
			const data = await vscode.workspace.fs.readFile(entry.uri);
			return Buffer.from(data);
		} catch {
			// File might have been deleted externally
			this.cacheMetadata.delete(key);
			this.cacheSize -= entry.size;
			return undefined;
		}
	}

	/**
	 * Reads a text file from the given URI.
	 * @param {vscode.Uri} uri - The URI of the file to read.
	 * @returns {Promise<string>} The file contents as a string.
	 */
	public async readTextFile(uri: vscode.Uri): Promise<string> {
		const data = await vscode.workspace.fs.readFile(uri);
		return Buffer.from(data).toString("utf8");
	}

	/**
	 * Saves an audio file to a user-specified location.
	 * @param {Buffer} data - The audio data to save.
	 * @param {string} fileName - The name of the file to save.
	 * @param {string} format - The audio format (mp3 or wav).
	 * @returns {Promise<vscode.Uri | undefined>} The URI of the saved file, or undefined if not saved.
	 */
	public async saveAudioFile(
		data: Buffer,
		fileName: string,
		format: "mp3" | "wav" = "mp3"
	): Promise<vscode.Uri | undefined> {
		try {
			// Get user-configured export location or use default
			const config = vscode.workspace.getConfiguration("elevenlabs-tts");
			let exportPath = config.get<string>("exportPath");

			let exportUri: vscode.Uri;
			if (exportPath) {
				exportUri = vscode.Uri.file(exportPath);
			} else {
				// Use default location in global storage
				exportUri = vscode.Uri.joinPath(
					this.context.globalStorageUri,
					"exports"
				);
			}

			// Create directory if it doesn't exist
			await vscode.workspace.fs.createDirectory(exportUri);

			// Create file name with timestamp
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, "_");
			const fullFileName = `${sanitizedFileName}_${timestamp}.${format}`;
			const fileUri = vscode.Uri.joinPath(exportUri, fullFileName);

			// Write file
			await vscode.workspace.fs.writeFile(fileUri, data);

			// Show success message with option to open
			const action = await vscode.window.showInformationMessage(
				`Audio saved to ${fullFileName}`,
				"Open",
				"Open Folder"
			);

			if (action === "Open") {
				await vscode.commands.executeCommand("vscode.open", fileUri);
			} else if (action === "Open Folder") {
				await vscode.commands.executeCommand("revealFileInOS", fileUri);
			}

			return fileUri;
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to save audio file: ${error}`);
			return undefined;
		}
	}

	/**
	 * Caches audio data for later retrieval.
	 * @param {string} key - The cache key to associate with the audio data.
	 * @param {Buffer} data - The audio data to cache.
	 * @returns {Promise<void>}
	 */
	public async setAudioCache(key: string, data: Buffer): Promise<void> {
		try {
			// Ensure cache directory exists
			const cacheDir = vscode.Uri.joinPath(
				this.context.globalStorageUri,
				"cache"
			);
			await vscode.workspace.fs.createDirectory(cacheDir);

			// Create file URI for this cache entry
			const fileUri = vscode.Uri.joinPath(cacheDir, `${key}.bin`);

			// Write data to file
			await vscode.workspace.fs.writeFile(fileUri, data);

			// Update cache metadata
			const entry: CacheEntry = {
				key,
				size: data.length,
				lastAccessed: Date.now(),
				uri: fileUri,
			};

			// If updating existing entry, adjust cache size
			const existingEntry = this.cacheMetadata.get(key);
			if (existingEntry) {
				this.cacheSize -= existingEntry.size;
			}

			this.cacheMetadata.set(key, entry);
			this.cacheSize += data.length;

			// Enforce cache size limit
			await this.enforceCacheLimit();
		} catch {
			// Silently fail for cache operations
		}
	}

	/**
	 * Enforces the cache size limit using LRU eviction strategy.
	 * @returns {Promise<void>}
	 */
	private async enforceCacheLimit(): Promise<void> {
		if (this.cacheSize <= this.MAX_CACHE_SIZE) {
			await this.saveCacheMetadata();
			return;
		}

		// Sort entries by last accessed time (oldest first)
		const sortedEntries = Array.from(this.cacheMetadata.entries()).sort(
			(a, b) => a[1].lastAccessed - b[1].lastAccessed
		);

		// Delete oldest entries until under limit
		for (const [key, entry] of sortedEntries) {
			if (this.cacheSize <= this.MAX_CACHE_SIZE) {
				break;
			}

			try {
				// Delete the file
				await vscode.workspace.fs.delete(entry.uri);

				// Remove from metadata and update size
				this.cacheMetadata.delete(key);
				this.cacheSize -= entry.size;
			} catch {
				// File might already be deleted
				this.cacheMetadata.delete(key);
				this.cacheSize -= entry.size;
			}
		}

		await this.saveCacheMetadata();
	}

	/**
	 * Initializes the cache by loading metadata from disk.
	 * @returns {Promise<void>}
	 */
	private async initializeCache(): Promise<void> {
		try {
			const cacheDir = vscode.Uri.joinPath(
				this.context.globalStorageUri,
				"cache"
			);
			const metadataUri = vscode.Uri.joinPath(cacheDir, "metadata.json");

			// Try to read existing metadata
			const metadataData = await vscode.workspace.fs.readFile(metadataUri);
			const metadata = JSON.parse(Buffer.from(metadataData).toString("utf8"));

			// Restore cache metadata
			this.cacheSize = 0;
			for (const [key, entry] of Object.entries(metadata)) {
				const cacheEntry = entry as CacheEntry;
				cacheEntry.uri = vscode.Uri.parse(cacheEntry.uri.toString());
				this.cacheMetadata.set(key, cacheEntry);
				this.cacheSize += cacheEntry.size;
			}
		} catch {
			// No existing cache or corrupted metadata, start fresh
			this.cacheMetadata.clear();
			this.cacheSize = 0;
		}
	}

	/**
	 * Saves cache metadata to disk.
	 * @returns {Promise<void>}
	 */
	private async saveCacheMetadata(): Promise<void> {
		try {
			const cacheDir = vscode.Uri.joinPath(
				this.context.globalStorageUri,
				"cache"
			);
			await vscode.workspace.fs.createDirectory(cacheDir);

			const metadataUri = vscode.Uri.joinPath(cacheDir, "metadata.json");

			// Convert Map to object for JSON serialization
			const metadata: Record<
				string,
				Omit<CacheEntry, "uri"> & { uri: string }
			> = {};
			for (const [key, entry] of this.cacheMetadata.entries()) {
				metadata[key] = {
					key: entry.key,
					size: entry.size,
					lastAccessed: entry.lastAccessed,
					uri: entry.uri.toString(),
				};
			}

			const data = Buffer.from(JSON.stringify(metadata, null, 2), "utf8");
			await vscode.workspace.fs.writeFile(metadataUri, data);
		} catch {
			// Silently fail for metadata operations
		}
	}
}
