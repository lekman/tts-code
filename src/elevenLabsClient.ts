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

import { ElevenLabsClient as ElevenLabsSDK } from "@elevenlabs/elevenlabs-js";
import { Voice } from "@elevenlabs/elevenlabs-js/api";
import * as vscode from "vscode";

/**
 * Voice settings for ElevenLabs API
 */
interface VoiceSettings {
	stability: number;
	similarity_boost: number;
}

/**
 * Custom error class for authentication failures
 */
export class AuthenticationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AuthenticationError";
		Object.setPrototypeOf(this, AuthenticationError.prototype);
	}
}

/**
 * Audio format options for ElevenLabs API
 */
export type AudioFormat =
	| "mp3_44100_128"
	| "mp3_44100_96"
	| "mp3_44100_64"
	| "pcm_16000"
	| "pcm_22050"
	| "pcm_24000"
	| "pcm_44100";

/**
 * Client wrapper for the ElevenLabs SDK.
 * Provides a simplified interface for text-to-speech operations with chunking support.
 */
export class ElevenLabsClient {
	private static readonly DEFAULT_MODEL_ID = "eleven_monolingual_v1";
	private static readonly DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Default voice (Rachel)
	private static readonly MAX_CHUNK_SIZE = 4000; // Characters per API call

	private client: ElevenLabsSDK;
	private defaultVoiceId: string;

	/**
	 * Creates a new ElevenLabsClient instance.
	 * @param {string} apiKey - The ElevenLabs API key for authentication.
	 * @param {string} defaultVoiceId - Optional default voice ID to use.
	 */
	constructor(apiKey: string, defaultVoiceId?: string) {
		this.client = new ElevenLabsSDK({
			apiKey,
		});
		this.defaultVoiceId = defaultVoiceId || ElevenLabsClient.DEFAULT_VOICE_ID;
	}

	/**
	 * Gets the list of available voices from the API.
	 * @returns {Promise<Voice[]>} Array of voice objects.
	 */
	public async getVoices(): Promise<Voice[]> {
		try {
			const response = await this.client.voices.getAll();
			return response.voices;
		} catch (error) {
			// Handle authentication errors
			const err = error as {
				statusCode?: number;
				status?: number;
				message?: string;
			};
			if (
				err.statusCode === 401 ||
				err.statusCode === 403 ||
				err.status === 401 ||
				err.status === 403 ||
				(err.message && err.message.toLowerCase().includes("unauthorized")) ||
				(err.message && err.message.toLowerCase().includes("invalid api key"))
			) {
				throw new AuthenticationError(
					`Invalid API key: ${err.message || error}`
				);
			}
			throw new Error(`Failed to fetch voices: ${err.message || error}`);
		}
	}

	/**
	 * Updates the default voice ID.
	 * @param {string} voiceId - The new default voice ID.
	 */
	public setDefaultVoiceId(voiceId: string): void {
		this.defaultVoiceId = voiceId;
	}

	/**
	 * Converts text to speech using the ElevenLabs API.
	 * @param {string} text - The text to convert to speech.
	 * @param {string} voiceId - Optional voice ID to use (defaults to instance default).
	 * @param {AudioFormat} format - Optional audio format (defaults to mp3_44100_128).
	 * @param {VoiceSettings} voiceSettings - Optional voice settings for stability and similarity.
	 * @returns {Promise<Buffer>} The generated audio data as a Buffer.
	 * @throws {Error} If the API request fails.
	 */
	public async textToSpeech(
		text: string,
		voiceId?: string,
		format: AudioFormat = "mp3_44100_128",
		voiceSettings?: VoiceSettings
	): Promise<Buffer> {
		try {
			const response = await this.client.textToSpeech.convert(
				voiceId || this.defaultVoiceId,
				{
					text,
					modelId: ElevenLabsClient.DEFAULT_MODEL_ID,
					voiceSettings: voiceSettings || {
						stability: 0.5,
						similarity_boost: 0.5,
					},
					outputFormat: format as
						| "mp3_44100_128"
						| "mp3_44100_96"
						| "mp3_44100_64"
						| "pcm_16000"
						| "pcm_22050"
						| "pcm_24000"
						| "pcm_44100",
				}
			);

			// Convert the response to a Buffer
			const chunks: Uint8Array[] = [];
			for await (const chunk of response) {
				chunks.push(chunk);
			}

			// Combine all chunks into a single buffer
			const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
			const combinedBuffer = new Uint8Array(totalLength);
			let offset = 0;
			for (const chunk of chunks) {
				combinedBuffer.set(chunk, offset);
				offset += chunk.length;
			}

			return Buffer.from(combinedBuffer);
		} catch (error) {
			// Handle rate limiting - the SDK should handle retries automatically
			const err = error as {
				statusCode?: number;
				status?: number;
				message?: string;
			};
			if (err.statusCode === 429 || err.status === 429) {
				vscode.window.showWarningMessage(
					"Rate limited by ElevenLabs API. Please try again later."
				);
			}
			// Handle authentication errors (401 or 403)
			// Check both statusCode and status properties, and also check error message
			if (
				err.statusCode === 401 ||
				err.statusCode === 403 ||
				err.status === 401 ||
				err.status === 403 ||
				(err.message && err.message.toLowerCase().includes("unauthorized")) ||
				(err.message && err.message.toLowerCase().includes("invalid api key"))
			) {
				throw new AuthenticationError(
					`Invalid API key: ${err.message || error}`
				);
			}
			throw new Error(`Failed to generate speech: ${err.message || error}`);
		}
	}

	/**
	 * Handles large texts by splitting them into chunks and processing each chunk.
	 * @param {string} text - The text to convert to speech.
	 * @param {string} voiceId - Optional voice ID to use.
	 * @param {AudioFormat} format - Optional audio format.
	 * @param {VoiceSettings} voiceSettings - Optional voice settings.
	 * @param {Function} onProgress - Optional callback for progress updates.
	 * @returns {Promise<Buffer[]>} Array of audio buffers for each chunk.
	 */
	public async textToSpeechChunked(
		text: string,
		voiceId?: string,
		format: AudioFormat = "mp3_44100_128",
		voiceSettings?: VoiceSettings,
		onProgress?: (progress: number, message: string) => void
	): Promise<Buffer[]> {
		// If text is small enough, process as single chunk
		if (text.length <= ElevenLabsClient.MAX_CHUNK_SIZE) {
			const buffer = await this.textToSpeech(
				text,
				voiceId,
				format,
				voiceSettings
			);
			return [buffer];
		}

		// Split text into chunks
		const chunks = this.splitTextIntoChunks(text);
		const audioBuffers: Buffer[] = [];
		let processedChunks = 0;

		for (const chunk of chunks) {
			try {
				const audioBuffer = await this.textToSpeech(
					chunk,
					voiceId,
					format,
					voiceSettings
				);
				audioBuffers.push(audioBuffer);

				processedChunks++;
				const progress = Math.round((processedChunks / chunks.length) * 100);
				if (onProgress) {
					onProgress(
						progress,
						`Processing chunk ${processedChunks} of ${chunks.length}`
					);
				}
			} catch (error) {
				throw new Error(
					`Failed to process chunk ${processedChunks + 1}: ${error}`
				);
			}
		}

		return audioBuffers;
	}

	/**
	 * Splits text into chunks at sentence boundaries when possible.
	 * @param {string} text - The text to split.
	 * @returns {string[]} Array of text chunks.
	 */
	private splitTextIntoChunks(text: string): string[] {
		const chunks: string[] = [];
		const maxChunkSize = ElevenLabsClient.MAX_CHUNK_SIZE;

		// Try to split at sentence boundaries
		const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

		let currentChunk = "";

		for (const sentence of sentences) {
			// If adding this sentence would exceed the limit
			if (currentChunk.length + sentence.length > maxChunkSize) {
				// If the current chunk is not empty, save it
				if (currentChunk.length > 0) {
					chunks.push(currentChunk.trim());
					currentChunk = "";
				}

				// If the sentence itself is longer than maxChunkSize
				if (sentence.length > maxChunkSize) {
					// Split by words
					const words = sentence.split(/\s+/);
					let wordChunk = "";

					for (const word of words) {
						if (wordChunk.length + word.length + 1 > maxChunkSize) {
							if (wordChunk) {
								chunks.push(wordChunk.trim());
							}
							wordChunk = word;
						} else {
							wordChunk += (wordChunk ? " " : "") + word;
						}
					}

					if (wordChunk) {
						currentChunk = wordChunk;
					}
				} else {
					currentChunk = sentence;
				}
			} else {
				currentChunk += sentence;
			}
		}

		// Add the last chunk if not empty
		if (currentChunk.trim()) {
			chunks.push(currentChunk.trim());
		}

		return chunks;
	}
}
