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

import { ElevenLabsClient } from "./elevenLabsClient";
import { WebviewProvider } from "./webviewProvider";

/**
 * Playback state for audio
 */
export type PlaybackState = "playing" | "paused" | "stopped";

/**
 * Playback event types
 */
export interface PlaybackEvent {
	type: "play" | "pause" | "resume" | "stop" | "seek" | "progress" | "duration";
	position: number;
	duration?: number;
	audioData?: Buffer;
}

/**
 * Manages audio playback and generation for the TTS extension.
 * Handles integration with ElevenLabs API and audio caching.
 */
export class AudioManager {
	private audioCache: Map<string, Buffer> = new Map();
	private currentAudioData?: Buffer;
	private currentCacheSize = 0;
	private currentDuration: number = 0;
	private currentPlaybackState: PlaybackState = "stopped";
	private currentPosition: number = 0;
	private elevenLabsClient?: ElevenLabsClient;
	private eventEmitter = new vscode.EventEmitter<PlaybackEvent>();
	private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
	private webviewProvider?: WebviewProvider;

	/**
	 * Cleans up resources used by the AudioManager.
	 * @returns {void}
	 */
	public dispose(): void {
		// Stop playback
		this.stop();

		// Clear cache
		this.audioCache.clear();
		this.currentCacheSize = 0;

		// Dispose event emitter
		this.eventEmitter.dispose();
	}

	/**
	 * Generates audio from text using ElevenLabs API.
	 * @param {string} text - The text to convert to speech.
	 * @param {string} cacheKey - A unique key for caching the audio.
	 * @param {string} voiceId - Optional voice ID to use.
	 * @returns {Promise<Buffer>} Promise resolving to audio data buffer.
	 */
	public async generateAudio(
		text: string,
		cacheKey: string,
		voiceId?: string
	): Promise<Buffer> {
		// Check if client is initialized
		if (!this.elevenLabsClient) {
			throw new Error(
				"AudioManager not initialized. Please provide an API key."
			);
		}

		// Check cache first
		if (this.audioCache.has(cacheKey)) {
			return this.audioCache.get(cacheKey)!;
		}

		// Generate audio
		const audioBuffer = await this.elevenLabsClient.textToSpeech(text, voiceId);

		// Cache the result
		this.cacheAudio(cacheKey, audioBuffer);

		// Store as current audio
		this.currentAudioData = audioBuffer;

		return audioBuffer;
	}

	/**
	 * Generates audio for large texts by chunking.
	 * @param {string} text - The text to convert to speech.
	 * @param {string} cacheKey - A unique key for caching the audio.
	 * @param {string} voiceId - Optional voice ID to use.
	 * @param {Function} onProgress - Optional progress callback.
	 * @returns {Promise<Buffer>} Promise resolving to combined audio data buffer.
	 */
	public async generateAudioChunked(
		text: string,
		cacheKey: string,
		voiceId?: string,
		onProgress?: (progress: number, message: string) => void
	): Promise<Buffer> {
		// Check if client is initialized
		if (!this.elevenLabsClient) {
			throw new Error(
				"AudioManager not initialized. Please provide an API key."
			);
		}

		// Check cache first
		if (this.audioCache.has(cacheKey)) {
			return this.audioCache.get(cacheKey)!;
		}

		// Generate audio chunks
		const audioChunks = await this.elevenLabsClient.textToSpeechChunked(
			text,
			voiceId,
			"mp3_44100_128",
			undefined,
			onProgress
		);

		// Combine chunks
		const combinedBuffer = Buffer.concat(audioChunks);

		// Cache the result
		this.cacheAudio(cacheKey, combinedBuffer);

		// Store as current audio
		this.currentAudioData = combinedBuffer;

		return combinedBuffer;
	}

	/**
	 * Gets the current audio data.
	 * @returns {Buffer | undefined} The current audio buffer or undefined.
	 */
	public getCurrentAudioData(): Buffer | undefined {
		return this.currentAudioData;
	}

	/**
	 * Gets the current audio duration.
	 * @returns {number} The duration in seconds.
	 */
	public getCurrentDuration(): number {
		return this.currentDuration;
	}

	/**
	 * Gets the current playback position.
	 * @returns {number} The current position in seconds.
	 */
	public getCurrentPosition(): number {
		return this.currentPosition;
	}

	/**
	 * Gets the current playback state.
	 * @returns {PlaybackState} The current state.
	 */
	public getPlaybackState(): PlaybackState {
		return this.currentPlaybackState;
	}

	/**
	 * Initializes the AudioManager with an API key.
	 * @param {string} apiKey - The ElevenLabs API key.
	 * @returns {void}
	 */
	public initialize(apiKey: string): void {
		this.elevenLabsClient = new ElevenLabsClient(apiKey);
	}

	/**
	 * Gets the playback state changed event.
	 * @returns {vscode.Event<PlaybackEvent>} The event emitter.
	 */
	public get onPlaybackStateChanged(): vscode.Event<PlaybackEvent> {
		return this.eventEmitter.event;
	}

	/**
	 * Pauses audio playback.
	 * @returns {void}
	 */
	public pause(): void {
		this.currentPlaybackState = "paused";
		this.eventEmitter.fire({ type: "pause", position: this.currentPosition });
	}

	/**
	 * Plays audio starting from a specific position.
	 * @param {Buffer} audioData - The audio data to play.
	 * @param {number} startPosition - The position to start from in seconds.
	 * @returns {void}
	 */
	public play(audioData: Buffer, startPosition: number = 0): void {
		this.currentAudioData = audioData;
		this.currentPlaybackState = "playing";
		this.currentPosition = startPosition;

		// Calculate duration based on audio format (MP3 at 128kbps)
		// This is an approximation - actual duration should come from webview
		const bitrate = 128000; // 128 kbps
		const durationSeconds = (audioData.length * 8) / bitrate;
		this.currentDuration = durationSeconds;

		this.eventEmitter.fire({
			type: "play",
			position: startPosition,
			duration: durationSeconds,
			audioData: audioData,
		});

		// Send audio to webview if available
		if (this.webviewProvider) {
			this.sendAudioToWebview(audioData);
		}
	}

	/**
	 * Resumes audio playback.
	 * @returns {void}
	 */
	public resume(): void {
		this.currentPlaybackState = "playing";
		this.eventEmitter.fire({ type: "resume", position: this.currentPosition });
	}

	/**
	 * Sets the webview provider for audio playback.
	 * @param {WebviewProvider} webviewProvider - The webview provider instance.
	 * @returns {void}
	 */
	public setWebviewProvider(webviewProvider: WebviewProvider): void {
		this.webviewProvider = webviewProvider;
	}

	/**
	 * Skips backward in the audio.
	 * @param {number} seconds - Number of seconds to skip backward.
	 * @returns {void}
	 */
	public skipBackward(seconds: number = 10): void {
		this.currentPosition = Math.max(0, this.currentPosition - seconds);
		this.eventEmitter.fire({ type: "seek", position: this.currentPosition });
	}

	/**
	 * Skips forward in the audio.
	 * @param {number} seconds - Number of seconds to skip forward.
	 * @returns {void}
	 */
	public skipForward(seconds: number = 10): void {
		const newPosition = Math.min(
			this.currentPosition + seconds,
			this.currentDuration
		);
		this.currentPosition = newPosition;
		this.eventEmitter.fire({ type: "seek", position: this.currentPosition });
	}

	/**
	 * Stops audio playback.
	 * @returns {void}
	 */
	public stop(): void {
		this.currentPlaybackState = "stopped";
		this.currentPosition = 0;
		this.eventEmitter.fire({ type: "stop", position: 0 });
	}

	/**
	 * Updates the playback position from the webview.
	 * @param {number} position - The new position in seconds.
	 * @returns {void}
	 */
	public updatePosition(position: number): void {
		this.currentPosition = position;
		this.eventEmitter.fire({ type: "progress", position });
	}

	/**
	 * Caches audio data with LRU eviction.
	 * @param {string} key - The cache key.
	 * @param {Buffer} data - The audio data to cache.
	 * @returns {void}
	 */
	private cacheAudio(key: string, data: Buffer): void {
		const dataSize = data.length;

		// If single item is larger than max cache size, don't cache it
		if (dataSize > this.MAX_CACHE_SIZE) {
			return;
		}

		// Evict items until we have space
		while (
			this.currentCacheSize + dataSize > this.MAX_CACHE_SIZE &&
			this.audioCache.size > 0
		) {
			const firstKey = this.audioCache.keys().next().value;
			const evictedData = this.audioCache.get(firstKey);
			if (evictedData) {
				this.currentCacheSize -= evictedData.length;
				this.audioCache.delete(firstKey);
			}
		}

		// Add new item
		this.audioCache.set(key, data);
		this.currentCacheSize += dataSize;
	}

	/**
	 * Sends audio data to the webview for playback.
	 * @param {Buffer} audioData - The audio data to send.
	 * @returns {void}
	 */
	private sendAudioToWebview(audioData: Buffer): void {
		if (!this.webviewProvider) {
			return;
		}

		// Convert buffer to base64 for webview transfer
		const base64Audio = audioData.toString("base64");

		// Send message to webview
		this.webviewProvider.postMessage({
			type: "loadAudio",
			data: base64Audio,
			format: "mp3",
		});
	}
}
