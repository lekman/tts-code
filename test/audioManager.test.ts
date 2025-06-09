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

// Mock vscode module
jest.mock("vscode");

import { AudioManager } from "../src/audioManager";

// Mock ElevenLabsClient
jest.mock("../src/elevenLabsClient", () => {
	return {
		ElevenLabsClient: jest.fn().mockImplementation(() => {
			return {
				textToSpeech: jest.fn(),
				textToSpeechChunked: jest.fn(),
			};
		}),
	};
});

describe("AudioManager", () => {
	let audioManager: AudioManager;
	let mockEventEmitter: any;
	let mockFireSpy: jest.Mock;

	beforeEach(() => {
		// Clear all mocks before creating a new instance
		jest.clearAllMocks();

		audioManager = new AudioManager();
		// Get the EventEmitter instance created by AudioManager
		mockEventEmitter = (audioManager as any).eventEmitter;
		// The fire method should be a jest.fn() from our mock
		mockFireSpy = mockEventEmitter.fire;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("constructor", () => {
		it("should instantiate", () => {
			expect(audioManager).toBeInstanceOf(AudioManager);
		});
	});

	describe("initialize", () => {
		it("should initialize with API key", () => {
			audioManager.initialize("test-api-key");
			// Verify ElevenLabsClient was created (tested through generateAudio)
			expect(audioManager).toBeInstanceOf(AudioManager);
		});
	});

	describe("generateAudio", () => {
		it("should throw error if not initialized", async () => {
			await expect(
				audioManager.generateAudio("test text", "cache-key")
			).rejects.toThrow("AudioManager not initialized");
		});

		it("should generate audio when initialized", async () => {
			const mockAudioData = Buffer.from("mock audio data");
			const mockTextToSpeech = jest.fn().mockResolvedValue(mockAudioData);

			// Mock the ElevenLabsClient
			const ElevenLabsClient =
				require("../src/elevenLabsClient").ElevenLabsClient;
			ElevenLabsClient.mockImplementation(() => ({
				textToSpeech: mockTextToSpeech,
			}));

			audioManager.initialize("test-api-key");
			const result = await audioManager.generateAudio("test text", "cache-key");

			expect(mockTextToSpeech).toHaveBeenCalledWith("test text", undefined);
			expect(result).toEqual(mockAudioData);
		});

		it("should use cache for repeated requests", async () => {
			const mockAudioData = Buffer.from("mock audio data");
			const mockTextToSpeech = jest.fn().mockResolvedValue(mockAudioData);

			const ElevenLabsClient =
				require("../src/elevenLabsClient").ElevenLabsClient;
			ElevenLabsClient.mockImplementation(() => ({
				textToSpeech: mockTextToSpeech,
			}));

			audioManager.initialize("test-api-key");

			// First call
			await audioManager.generateAudio("test text", "cache-key");
			// Second call with same cache key
			await audioManager.generateAudio("test text", "cache-key");

			// Should only call API once
			expect(mockTextToSpeech).toHaveBeenCalledTimes(1);
		});

		it("should pass voice ID when provided", async () => {
			const mockAudioData = Buffer.from("mock audio data");
			const mockTextToSpeech = jest.fn().mockResolvedValue(mockAudioData);

			const ElevenLabsClient =
				require("../src/elevenLabsClient").ElevenLabsClient;
			ElevenLabsClient.mockImplementation(() => ({
				textToSpeech: mockTextToSpeech,
			}));

			audioManager.initialize("test-api-key");
			await audioManager.generateAudio(
				"test text",
				"cache-key",
				"voice-id-123"
			);

			expect(mockTextToSpeech).toHaveBeenCalledWith(
				"test text",
				"voice-id-123"
			);
		});
	});

	describe("generateAudioChunked", () => {
		it("should generate chunked audio", async () => {
			const mockChunks = [Buffer.from("chunk1"), Buffer.from("chunk2")];
			const mockTextToSpeechChunked = jest.fn().mockResolvedValue(mockChunks);

			const ElevenLabsClient =
				require("../src/elevenLabsClient").ElevenLabsClient;
			ElevenLabsClient.mockImplementation(() => ({
				textToSpeechChunked: mockTextToSpeechChunked,
			}));

			audioManager.initialize("test-api-key");
			const result = await audioManager.generateAudioChunked(
				"long text",
				"cache-key"
			);

			expect(mockTextToSpeechChunked).toHaveBeenCalled();
			expect(result).toEqual(Buffer.concat(mockChunks));
		});

		it("should pass progress callback", async () => {
			const mockChunks = [Buffer.from("chunk1")];
			const mockTextToSpeechChunked = jest.fn().mockResolvedValue(mockChunks);
			const progressCallback = jest.fn();

			const ElevenLabsClient =
				require("../src/elevenLabsClient").ElevenLabsClient;
			ElevenLabsClient.mockImplementation(() => ({
				textToSpeechChunked: mockTextToSpeechChunked,
			}));

			audioManager.initialize("test-api-key");
			await audioManager.generateAudioChunked(
				"long text",
				"cache-key",
				undefined,
				progressCallback
			);

			expect(mockTextToSpeechChunked).toHaveBeenCalledWith(
				"long text",
				undefined,
				"mp3_44100_128",
				undefined,
				progressCallback
			);
		});
	});

	describe("playback controls", () => {
		const mockAudioData = Buffer.from("test audio");

		it("should play audio", () => {
			audioManager.play(mockAudioData, 5);

			expect(audioManager.getPlaybackState()).toBe("playing");
			expect(audioManager.getCurrentPosition()).toBe(5);
			expect(mockFireSpy).toHaveBeenCalledWith({
				type: "play",
				position: 5,
				duration: expect.any(Number),
				audioData: mockAudioData,
			});
		});

		it("should pause audio", () => {
			audioManager.play(mockAudioData);
			audioManager.pause();

			expect(audioManager.getPlaybackState()).toBe("paused");
			expect(mockFireSpy).toHaveBeenCalledWith({
				type: "pause",
				position: 0,
			});
		});

		it("should resume audio", () => {
			audioManager.play(mockAudioData);
			audioManager.pause();
			audioManager.resume();

			expect(audioManager.getPlaybackState()).toBe("playing");
			expect(mockFireSpy).toHaveBeenCalledWith({
				type: "resume",
				position: 0,
			});
		});

		it("should stop audio", () => {
			audioManager.play(mockAudioData, 10);
			audioManager.stop();

			expect(audioManager.getPlaybackState()).toBe("stopped");
			expect(audioManager.getCurrentPosition()).toBe(0);
			expect(mockFireSpy).toHaveBeenCalledWith({
				type: "stop",
				position: 0,
			});
		});

		it("should skip forward", () => {
			audioManager.play(mockAudioData);
			// Skip forward should respect duration limits
			audioManager.skipForward(15);

			// The position should be clamped to the duration
			const expectedPosition = audioManager.getCurrentPosition();
			expect(expectedPosition).toBeLessThanOrEqual(
				audioManager.getCurrentDuration()
			);
			expect(mockFireSpy).toHaveBeenCalledWith({
				type: "seek",
				position: expectedPosition,
			});
		});

		it("should skip backward", () => {
			audioManager.play(mockAudioData, 20);
			audioManager.skipBackward(10);

			expect(audioManager.getCurrentPosition()).toBe(10);
			expect(mockFireSpy).toHaveBeenCalledWith({
				type: "seek",
				position: 10,
			});
		});

		it("should not go below 0 when skipping backward", () => {
			audioManager.play(mockAudioData, 5);
			audioManager.skipBackward(10);

			expect(audioManager.getCurrentPosition()).toBe(0);
		});
	});

	describe("getCurrentAudioData", () => {
		it("should return current audio data", () => {
			const mockAudioData = Buffer.from("test audio");
			audioManager.play(mockAudioData);

			expect(audioManager.getCurrentAudioData()).toEqual(mockAudioData);
		});

		it("should return undefined when no audio", () => {
			expect(audioManager.getCurrentAudioData()).toBeUndefined();
		});
	});

	describe("getCurrentDuration", () => {
		it("should return duration after playing audio", () => {
			const mockAudioData = Buffer.from("test audio");
			audioManager.play(mockAudioData);

			const duration = audioManager.getCurrentDuration();
			expect(duration).toBeGreaterThan(0);
		});

		it("should return 0 when no audio", () => {
			expect(audioManager.getCurrentDuration()).toBe(0);
		});
	});

	describe("onPlaybackStateChanged", () => {
		it("should return event emitter", () => {
			const event = audioManager.onPlaybackStateChanged;
			expect(event).toBeDefined();
			// event is a property, not a function call, so we just check it's the same reference
			expect(event).toBe(mockEventEmitter.event);
		});
	});

	describe("dispose", () => {
		it("should clean up resources", () => {
			const mockAudioData = Buffer.from("test audio");
			audioManager.play(mockAudioData);

			audioManager.dispose();

			expect(audioManager.getPlaybackState()).toBe("stopped");
			expect(audioManager.getCurrentPosition()).toBe(0);
			expect(mockEventEmitter.dispose).toHaveBeenCalled();
		});
	});

	describe("cache management", () => {
		it("should evict old items when cache is full", async () => {
			const ElevenLabsClient =
				require("../src/elevenLabsClient").ElevenLabsClient;
			const mockTextToSpeech = jest.fn();

			// Create large buffers that will exceed cache size
			const largeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB
			mockTextToSpeech.mockResolvedValue(largeBuffer);

			ElevenLabsClient.mockImplementation(() => ({
				textToSpeech: mockTextToSpeech,
			}));

			audioManager.initialize("test-api-key");

			// Add 3 items to cache (150MB total, exceeds 100MB limit)
			await audioManager.generateAudio("text1", "key1");
			await audioManager.generateAudio("text2", "key2");
			await audioManager.generateAudio("text3", "key3");

			// All 3 calls should hit the API
			expect(mockTextToSpeech).toHaveBeenCalledTimes(3);

			// Now try to get the first item again - it should have been evicted
			await audioManager.generateAudio("text1", "key1");
			expect(mockTextToSpeech).toHaveBeenCalledTimes(4);
		});
	});
});
