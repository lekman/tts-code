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

import { AuthenticationError, ElevenLabsClient } from "../src/elevenLabsClient";

// Mock vscode module
jest.mock("vscode");

// Mock the ElevenLabs SDK - manual mock will be used from __mocks__ directory
jest.mock("@elevenlabs/elevenlabs-js");

// Import the mock functions after mocking
const { __mockTextToSpeechConvert, __mockVoicesGetAll } =
	require("@elevenlabs/elevenlabs-js") as {
		__mockTextToSpeechConvert: jest.Mock;
		__mockVoicesGetAll: jest.Mock;
	};

describe("ElevenLabsClient", () => {
	let client: ElevenLabsClient;
	const mockApiKey = "xi_test_api_key";
	const mockVoiceId = "test_voice_id";
	let mockShowWarningMessage: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();

		// Clear the mock function calls
		__mockTextToSpeechConvert.mockClear();
		__mockVoicesGetAll.mockClear();

		client = new ElevenLabsClient(mockApiKey);

		// Setup vscode mocks
		mockShowWarningMessage = jest.fn();
		vscode.window.showWarningMessage = mockShowWarningMessage;
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe("constructor", () => {
		it("should initialize with provided API key", () => {
			expect(client).toBeInstanceOf(ElevenLabsClient);
		});

		it("should use custom default voice ID if provided", () => {
			const customVoiceId = "custom_voice_id";
			const customClient = new ElevenLabsClient(mockApiKey, customVoiceId);
			expect(customClient).toBeInstanceOf(ElevenLabsClient);
		});
	});

	describe("textToSpeech", () => {
		it("should successfully convert text to speech", async () => {
			const mockAudioData = new Uint8Array([1, 2, 3, 4, 5]);
			// Mock the async iterator response
			const mockAsyncIterator = {
				[Symbol.asyncIterator]: async function* () {
					yield mockAudioData;
				},
			};
			__mockTextToSpeechConvert.mockResolvedValueOnce(mockAsyncIterator);

			const result = await client.textToSpeech("Hello world");

			expect(__mockTextToSpeechConvert).toHaveBeenCalledWith(
				"21m00Tcm4TlvDq8ikWAM",
				{
					text: "Hello world",
					modelId: "eleven_monolingual_v1",
					voiceSettings: {
						stability: 0.5,
						similarity_boost: 0.5,
					},
					outputFormat: "mp3_44100_128",
				}
			);
			expect(result).toEqual(Buffer.from(mockAudioData));
		});

		it("should use custom voice ID when provided", async () => {
			const mockAudioData = new Uint8Array([1, 2, 3]);
			const mockAsyncIterator = {
				[Symbol.asyncIterator]: async function* () {
					yield mockAudioData;
				},
			};
			__mockTextToSpeechConvert.mockResolvedValueOnce(mockAsyncIterator);

			await client.textToSpeech("Hello world", mockVoiceId);

			expect(__mockTextToSpeechConvert).toHaveBeenCalledWith(
				mockVoiceId,
				expect.any(Object)
			);
		});

		it("should use custom audio format when provided", async () => {
			const mockAudioData = new Uint8Array([1, 2, 3]);
			const mockAsyncIterator = {
				[Symbol.asyncIterator]: async function* () {
					yield mockAudioData;
				},
			};
			__mockTextToSpeechConvert.mockResolvedValueOnce(mockAsyncIterator);

			await client.textToSpeech("Hello world", undefined, "pcm_44100");

			expect(__mockTextToSpeechConvert).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					outputFormat: "pcm_44100",
				})
			);
		});

		it("should handle rate limit errors", async () => {
			const error = new Error("API Error") as Error & { statusCode: number };
			error.statusCode = 429;
			__mockTextToSpeechConvert.mockRejectedValueOnce(error);

			await expect(client.textToSpeech("Hello world")).rejects.toThrow(
				"Failed to generate speech: API Error"
			);
			expect(mockShowWarningMessage).toHaveBeenCalledWith(
				"Rate limited by ElevenLabs API. Please try again later."
			);
		});

		it("should throw AuthenticationError for invalid API key", async () => {
			const error = new Error("Unauthorized") as Error & { statusCode: number };
			error.statusCode = 401;
			__mockTextToSpeechConvert.mockRejectedValueOnce(error);

			await expect(client.textToSpeech("Hello world")).rejects.toThrow(
				AuthenticationError
			);

			// Reset the mock for the second test
			__mockTextToSpeechConvert.mockRejectedValueOnce(error);

			await expect(client.textToSpeech("Hello world")).rejects.toThrow(
				"Invalid API key: Unauthorized"
			);
		});

		it("should handle multiple audio chunks", async () => {
			const chunk1 = new Uint8Array([1, 2, 3]);
			const chunk2 = new Uint8Array([4, 5, 6]);
			const mockAsyncIterator = {
				[Symbol.asyncIterator]: async function* () {
					yield chunk1;
					yield chunk2;
				},
			};
			__mockTextToSpeechConvert.mockResolvedValueOnce(mockAsyncIterator);

			const result = await client.textToSpeech("Hello world");

			// Should combine both chunks
			const expectedBuffer = Buffer.from(new Uint8Array([1, 2, 3, 4, 5, 6]));
			expect(result).toEqual(expectedBuffer);
		});
	});

	describe("textToSpeechChunked", () => {
		it("should process small text as single chunk", async () => {
			const mockAudioData = new Uint8Array([1, 2, 3, 4, 5]);
			const mockAsyncIterator = {
				[Symbol.asyncIterator]: async function* () {
					yield mockAudioData;
				},
			};
			__mockTextToSpeechConvert.mockResolvedValueOnce(mockAsyncIterator);

			const result = await client.textToSpeechChunked("Short text");

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(Buffer.from(mockAudioData));
			expect(__mockTextToSpeechConvert).toHaveBeenCalledTimes(1);
		});

		it("should split large text into chunks", async () => {
			const mockAudioData = new Uint8Array([1, 2, 3]);
			const mockAsyncIterator = {
				[Symbol.asyncIterator]: async function* () {
					yield mockAudioData;
				},
			};
			__mockTextToSpeechConvert.mockResolvedValue(mockAsyncIterator);

			// Create text larger than MAX_CHUNK_SIZE (4000 chars)
			const largeText = "This is a test sentence. ".repeat(200); // ~5000 chars

			const result = await client.textToSpeechChunked(largeText);

			expect(result.length).toBeGreaterThan(1);
			expect(__mockTextToSpeechConvert).toHaveBeenCalledTimes(result.length);
		});

		it("should call progress callback", async () => {
			const mockAudioData = new Uint8Array([1, 2, 3]);
			const mockAsyncIterator = {
				[Symbol.asyncIterator]: async function* () {
					yield mockAudioData;
				},
			};
			__mockTextToSpeechConvert.mockResolvedValue(mockAsyncIterator);

			const largeText = "This is a test sentence. ".repeat(200);
			const progressCallback = jest.fn();

			await client.textToSpeechChunked(
				largeText,
				undefined,
				"mp3_44100_128",
				undefined,
				progressCallback
			);

			expect(progressCallback).toHaveBeenCalled();
			expect(progressCallback).toHaveBeenCalledWith(
				expect.any(Number),
				expect.stringContaining("Processing chunk")
			);
		});

		it("should handle chunk processing errors", async () => {
			const error = new Error("API Error");
			__mockTextToSpeechConvert.mockRejectedValueOnce(error);

			const largeText = "This is a test sentence. ".repeat(200);

			await expect(client.textToSpeechChunked(largeText)).rejects.toThrow(
				"Failed to process chunk 1"
			);
		});
	});

	describe("getVoices", () => {
		it("should fetch available voices", async () => {
			const mockVoices = [
				{ voice_id: "voice1", name: "Voice 1" },
				{ voice_id: "voice2", name: "Voice 2" },
			];
			__mockVoicesGetAll.mockResolvedValueOnce({ voices: mockVoices });

			const result = await client.getVoices();

			expect(__mockVoicesGetAll).toHaveBeenCalled();
			expect(result).toEqual(mockVoices);
		});

		it("should handle voice fetch errors", async () => {
			const error = new Error("Failed to fetch voices");
			__mockVoicesGetAll.mockRejectedValueOnce(error);

			await expect(client.getVoices()).rejects.toThrow(
				"Failed to fetch voices: Failed to fetch voices"
			);
		});
	});

	describe("setDefaultVoiceId", () => {
		it("should update default voice ID", async () => {
			const newVoiceId = "new_voice_id";
			client.setDefaultVoiceId(newVoiceId);

			// Mock response for the next call
			const mockAudioData = new Uint8Array([1, 2, 3]);
			const mockAsyncIterator = {
				[Symbol.asyncIterator]: async function* () {
					yield mockAudioData;
				},
			};
			__mockTextToSpeechConvert.mockResolvedValueOnce(mockAsyncIterator);

			await client.textToSpeech("test");

			expect(__mockTextToSpeechConvert).toHaveBeenCalledWith(
				newVoiceId,
				expect.any(Object)
			);
		});
	});

	describe("text chunking", () => {
		it("should split text at sentence boundaries", async () => {
			const mockAudioData = new Uint8Array([1, 2, 3]);
			const mockAsyncIterator = {
				[Symbol.asyncIterator]: async function* () {
					yield mockAudioData;
				},
			};
			__mockTextToSpeechConvert.mockResolvedValue(mockAsyncIterator);

			// Create text with clear sentence boundaries
			// Each sentence is 29 chars, we need > 4000 chars to trigger chunking
			const text = Array(150).fill("This is a complete sentence.").join(" "); // ~4350 chars total

			const result = await client.textToSpeechChunked(text);

			// Verify chunks were created
			expect(result.length).toBeGreaterThan(1);

			// Check that convert was called with complete sentences
			const calls = __mockTextToSpeechConvert.mock.calls;
			for (const call of calls) {
				const textParam = call[1].text;
				// Each chunk should end with proper punctuation
				expect(textParam).toMatch(/[.!?]$/);
			}
		});

		it("should handle very long sentences", async () => {
			const mockAudioData = new Uint8Array([1, 2, 3]);
			const mockAsyncIterator = {
				[Symbol.asyncIterator]: async function* () {
					yield mockAudioData;
				},
			};
			__mockTextToSpeechConvert.mockResolvedValue(mockAsyncIterator);

			// Create a very long sentence (>4000 chars)
			const longSentence = "word ".repeat(1000) + "."; // ~5000 chars

			const result = await client.textToSpeechChunked(longSentence);

			// Should split the long sentence
			expect(result.length).toBeGreaterThan(1);
		});
	});
});
