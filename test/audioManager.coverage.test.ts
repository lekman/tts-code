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

import { AudioManager } from "../src/audioManager";
import { ElevenLabsClient } from "../src/elevenLabsClient";
import { WebviewProvider } from "../src/webviewProvider";

describe("AudioManager Coverage Tests", () => {
	let audioManager: AudioManager;
	let mockWebviewProvider: WebviewProvider;

	beforeEach(() => {
		audioManager = new AudioManager();
		mockWebviewProvider = {
			postMessage: jest.fn(),
		} as any;
		audioManager.setWebviewProvider(mockWebviewProvider);
	});

	describe("Uncovered Lines in AudioManager", () => {
		it("should handle webview provider not set when playing", () => {
			// Remove webview provider
			audioManager.setWebviewProvider(undefined as any);

			// Should not throw when playing without webview
			expect(() => audioManager.play(Buffer.from("test-data"))).not.toThrow();
		});

		// TODO: Fix after resolving Jest module caching issues
		it.skip("should handle progress callback in generateAudioChunked", async () => {
			audioManager.initialize("test-api-key");

			const mockProgress = jest.fn();
			const mockBuffer = Buffer.from("test-audio", "base64");

			// Mock chunked response
			jest
				.spyOn(ElevenLabsClient.prototype, "textToSpeechChunked")
				.mockImplementation(
					async (text, voiceId, format, voiceSettings, onProgress) => {
						// Call progress callback multiple times
						onProgress?.(0, "Starting");
						onProgress?.(50, "Processing");
						onProgress?.(100, "Complete");
						return [mockBuffer];
					}
				);

			await audioManager.generateAudioChunked("test text", mockProgress as any);

			// Verify progress was called
			expect(mockProgress).toHaveBeenCalledTimes(3);
			expect(mockProgress).toHaveBeenCalledWith(0);
			expect(mockProgress).toHaveBeenCalledWith(50);
			expect(mockProgress).toHaveBeenCalledWith(100);
		});

		it("should handle pause when webview is not set", () => {
			// Set playing state
			audioManager.play(Buffer.from("test-data"));

			// Remove webview provider
			audioManager.setWebviewProvider(undefined as any);

			// Should not throw when pausing without webview
			expect(() => audioManager.pause()).not.toThrow();
		});

		it("should handle resume when webview is not set", () => {
			// Set paused state
			audioManager.play(Buffer.from("test-data"));
			audioManager.pause();

			// Remove webview provider
			audioManager.setWebviewProvider(undefined as any);

			// Should not throw when resuming without webview
			expect(() => audioManager.resume()).not.toThrow();
		});

		it("should handle stop when webview is not set", () => {
			// Set playing state
			audioManager.play(Buffer.from("test-data"));

			// Remove webview provider
			audioManager.setWebviewProvider(undefined as any);

			// Should not throw when stopping without webview
			expect(() => audioManager.stop()).not.toThrow();
		});

		it("should handle skipForward when audio is not playing", () => {
			// Should not throw when skipping without audio
			expect(() => audioManager.skipForward()).not.toThrow();
		});

		it("should handle skipBackward when audio is not playing", () => {
			// Should not throw when skipping without audio
			expect(() => audioManager.skipBackward()).not.toThrow();
		});

		it("should handle seek when webview is not set", () => {
			// Play audio first
			audioManager.play(Buffer.from("test-data"));

			// Remove webview provider
			audioManager.setWebviewProvider(undefined as any);

			// Should not throw when seeking without webview
			expect(() => audioManager.skipForward()).not.toThrow();
		});

		it("should handle updatePosition edge cases", () => {
			// Should handle negative position
			expect(() => audioManager.updatePosition(-1)).not.toThrow();

			// Should handle very large position
			expect(() => audioManager.updatePosition(999999)).not.toThrow();

			// Should handle NaN
			expect(() => audioManager.updatePosition(NaN)).not.toThrow();
		});

		// TODO: Fix after resolving Jest module caching issues
		it.skip("should emit playback state changes", (done) => {
			// Subscribe to state changes
			audioManager.onPlaybackStateChanged((state) => {
				expect(state).toBe("playing");
				done();
			});

			// Trigger state change
			audioManager.play(Buffer.from("test-data"));
		});

		it("should handle getCurrentAudioData when no audio is loaded", () => {
			// Should return undefined when no audio
			const result = audioManager.getCurrentAudioData();
			expect(result).toBeUndefined();
		});

		// TODO: Fix after resolving Jest module caching issues
		it.skip("should handle cache eviction", async () => {
			audioManager.initialize("test-api-key");

			// Mock API responses
			jest
				.spyOn(ElevenLabsClient.prototype, "textToSpeech")
				.mockResolvedValue(Buffer.from("audio1"))
				.mockResolvedValue(Buffer.from("audio2"))
				.mockResolvedValue(Buffer.from("audio3"));

			// Fill cache beyond limit (assuming 2 item limit for test)
			const maxCacheSize = 2;
			for (let i = 0; i < maxCacheSize + 1; i++) {
				await audioManager.generateAudio(`text${i}`, `key${i}`);
			}

			// First item should be evicted
			// Attempting to use first cache key should result in new API call
			jest.clearAllMocks();
			await audioManager.generateAudio("text0", "key0");

			// Should have made a new API call
			expect(ElevenLabsClient.prototype.textToSpeech).toHaveBeenCalled();
		});

		it("should handle dispose with active audio", () => {
			// Play audio
			audioManager.play(Buffer.from("test-data"));

			// Dispose should clean up without errors
			expect(() => audioManager.dispose()).not.toThrow();

			// Further operations should not throw
			expect(() => audioManager.play(Buffer.from("test-data"))).not.toThrow();
		});

		// TODO: Fix after resolving Jest module caching issues
		it.skip("should handle concurrent audio generation requests", async () => {
			audioManager.initialize("test-api-key");

			// Mock API to simulate delay
			let callCount = 0;
			jest
				.spyOn(ElevenLabsClient.prototype, "textToSpeech")
				.mockImplementation(async () => {
					callCount++;
					await new Promise((resolve) => setTimeout(resolve, 10));
					return Buffer.from(`audio${callCount}`);
				});

			// Make concurrent requests for the same content
			const promises = [
				audioManager.generateAudio("same text", "same-key"),
				audioManager.generateAudio("same text", "same-key"),
				audioManager.generateAudio("same text", "same-key"),
			];

			const results = await Promise.all(promises);

			// All should return the same result
			expect(results[0]).toBe(results[1]);
			expect(results[1]).toBe(results[2]);

			// API should only be called once due to caching
			expect(callCount).toBe(1);
		});

		it("should handle voice ID in audio generation", async () => {
			audioManager.initialize("test-api-key");

			const mockBuffer = Buffer.from("test-audio");
			jest
				.spyOn(ElevenLabsClient.prototype, "textToSpeech")
				.mockResolvedValue(mockBuffer);

			await audioManager.generateAudio(
				"test text",
				"cache-key",
				"custom-voice-id"
			);

			// Verify voice ID was passed
			expect(ElevenLabsClient.prototype.textToSpeech).toHaveBeenCalledWith(
				"test text",
				"custom-voice-id"
			);
		});

		it("should handle getCurrentDuration with invalid duration", () => {
			// Set up mock with NaN duration
			audioManager["currentDuration"] = NaN;

			// NaN is returned as-is
			expect(audioManager.getCurrentDuration()).toBeNaN();

			// Set up mock with negative duration
			audioManager["currentDuration"] = -10;

			// Negative duration is returned as-is
			expect(audioManager.getCurrentDuration()).toBe(-10);
		});
	});
});
