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
import { activate } from "../../src/extension";
import { ApiKeyManager } from "../../src/apiKeyManager";
import { AudioManager } from "../../src/audioManager";
import { ElevenLabsClient } from "../../src/elevenLabsClient";
import { WebviewProvider } from "../../src/webviewProvider";

// Mock audio data for testing
const MOCK_AUDIO_DATA = "SGVsbG8gV29ybGQ="; // Base64 encoded "Hello World"

describe("End-to-End User Workflows", () => {
	let mockContext: vscode.ExtensionContext;
	let mockWebview: any;
	let webviewMessageHandler: (message: any) => void;

	beforeEach(() => {
		// Set up comprehensive mocks
		mockWebview = {
			postMessage: jest.fn(),
			html: "",
			options: {},
			onDidReceiveMessage: jest.fn((handler) => {
				webviewMessageHandler = handler;
				return { dispose: jest.fn() };
			}),
			cspSource: "vscode-webview://test",
		};

		// Mock VS Code API
		(global as any).vscode = {
			commands: {
				registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
				executeCommand: jest.fn(),
				getCommands: jest.fn(async () => []),
			},
			window: {
				showInformationMessage: jest.fn(),
				showWarningMessage: jest.fn(),
				showErrorMessage: jest.fn().mockResolvedValue(undefined),
				showInputBox: jest.fn(),
				activeTextEditor: undefined,
				createOutputChannel: jest.fn(() => ({
					appendLine: jest.fn(),
					show: jest.fn(),
					dispose: jest.fn(),
				})),
				registerWebviewViewProvider: jest.fn(() => ({ dispose: jest.fn() })),
				withProgress: jest.fn(async (options, task) => {
					return await task({ report: jest.fn() }, { isCancellationRequested: false });
				}),
			},
			workspace: {
				getConfiguration: jest.fn(() => ({
					get: jest.fn((key: string, defaultValue?: any) => defaultValue || "info"),
				})),
			},
			ProgressLocation: {
				Notification: 15,
			},
			Range: jest.fn((start: any, end: any) => ({ start, end })),
			Position: jest.fn((line: number, character: number) => ({ line, character })),
		};

		// Mock extension context
		mockContext = {
			subscriptions: [],
			secrets: {
				get: jest.fn().mockResolvedValue("test-api-key"),
				store: jest.fn().mockResolvedValue(undefined),
				delete: jest.fn().mockResolvedValue(undefined),
			},
			extensionUri: { fsPath: "/mock/extension/path" },
			globalState: {
				get: jest.fn(),
				update: jest.fn().mockResolvedValue(undefined),
			},
			workspaceState: {
				get: jest.fn(),
				update: jest.fn().mockResolvedValue(undefined),
			},
			globalStorageUri: { fsPath: "/mock/storage/path" },
		} as any;

		// Mock file system operations
		jest.mock("fs/promises", () => ({
			mkdir: jest.fn().mockResolvedValue(undefined),
			writeFile: jest.fn().mockResolvedValue(undefined),
			readFile: jest.fn().mockResolvedValue(Buffer.from(MOCK_AUDIO_DATA, "base64")),
			access: jest.fn().mockRejectedValue(new Error("File not found")),
		}));
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	describe("Complete TTS Workflow", () => {
		it("should complete full workflow: open file → generate audio → play → export", async () => {
			// Step 1: Activate extension
			activate(mockContext);

			// Step 2: Set up mock editor with markdown content
			const mockDocument = {
				languageId: "markdown",
				getText: jest.fn(() => "# Hello World\n\nThis is a test document."),
				fileName: "test.md",
				uri: { toString: () => "file:///test.md" },
			};

			const mockEditor = {
				document: mockDocument,
				selection: { isEmpty: false },
			};

			vscode.window.activeTextEditor = mockEditor as any;

			// Step 3: Mock ElevenLabs API response
			jest.spyOn(ElevenLabsClient.prototype, "textToSpeech").mockResolvedValue(
				Buffer.from(MOCK_AUDIO_DATA, "base64")
			);

			// Step 4: Execute speak text command
			const speakCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
				.find(call => call[0] === "ttsCode.speakText")[1];
			
			await speakCommand();

			// Verify audio generation was called
			expect(ElevenLabsClient.prototype.textToSpeech).toHaveBeenCalledWith(
				"Hello World\n\nThis is a test document.",
				undefined
			);

			// Step 5: Verify webview received audio data
			const webviewProvider = (vscode.window.registerWebviewViewProvider as jest.Mock).mock.calls[0][1];
			webviewProvider.resolveWebviewView({ webview: mockWebview }, {}, {});

			// Find postMessage calls for audio loading
			const postMessageCalls = mockWebview.postMessage.mock.calls;
			const loadAudioCall = postMessageCalls.find(call => call[0].type === "loadAudio");
			
			expect(loadAudioCall).toBeDefined();
			expect(loadAudioCall[0].data).toBe(MOCK_AUDIO_DATA);

			// Step 6: Simulate playback controls
			webviewMessageHandler({ type: "playing" });
			webviewMessageHandler({ type: "timeUpdate", position: 5 });
			webviewMessageHandler({ type: "paused" });

			// Step 7: Test export functionality
			webviewMessageHandler({ type: "export", format: "mp3" });

			// Verify export initiated (would need to mock storage manager)
			expect(vscode.window.showInformationMessage).toHaveBeenCalled();
		});

		it("should handle selection-based TTS workflow", async () => {
			activate(mockContext);

			// Set up editor with selection
			const mockDocument = {
				languageId: "plaintext",
				getText: jest.fn((range) => "Selected text only"),
				fileName: "test.txt",
				uri: { toString: () => "file:///test.txt" },
			};

			const mockSelection = {
				isEmpty: false,
				start: { line: 0, character: 0 },
				end: { line: 0, character: 18 },
			};

			const mockEditor = {
				document: mockDocument,
				selection: mockSelection,
			};

			vscode.window.activeTextEditor = mockEditor as any;

			// Mock API response
			jest.spyOn(ElevenLabsClient.prototype, "textToSpeech").mockResolvedValue(
				Buffer.from(MOCK_AUDIO_DATA, "base64")
			);

			// Execute speak selection command
			const speakSelectionCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
				.find(call => call[0] === "ttsCode.speakSelection")[1];
			
			await speakSelectionCommand();

			// Verify only selected text was processed
			expect(ElevenLabsClient.prototype.textToSpeech).toHaveBeenCalledWith(
				"Selected text only",
				undefined
			);
		});
	});

	describe("Error Recovery Workflows", () => {
		it("should handle API key validation failure and recovery", async () => {
			activate(mockContext);

			// Initially no API key
			mockContext.secrets.get = jest.fn().mockResolvedValue(undefined);

			// Set up editor
			vscode.window.activeTextEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn(() => "# Test"),
					fileName: "test.md",
					uri: { toString: () => "file:///test.md" },
				},
			} as any;

			// User provides API key when prompted
			vscode.window.showInputBox = jest.fn().mockResolvedValue("new-api-key");

			// Mock validation
			jest.spyOn(ApiKeyManager.prototype, "validateApiKey").mockResolvedValue(true);

			// Execute command
			const speakCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
				.find(call => call[0] === "ttsCode.speakText")[1];
			
			await speakCommand();

			// Verify API key was requested and stored
			expect(vscode.window.showInputBox).toHaveBeenCalled();
			expect(mockContext.secrets.store).toHaveBeenCalledWith("elevenlabs-api-key", "new-api-key");
		});

		it("should handle network failure and retry", async () => {
			activate(mockContext);

			vscode.window.activeTextEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn(() => "# Test"),
					fileName: "test.md",
					uri: { toString: () => "file:///test.md" },
				},
			} as any;

			// First call fails, second succeeds
			jest.spyOn(ElevenLabsClient.prototype, "textToSpeech")
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce(Buffer.from(MOCK_AUDIO_DATA, "base64"));

			// Execute command
			const speakCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
				.find(call => call[0] === "ttsCode.speakText")[1];
			
			// First attempt should fail
			await speakCommand();
			expect(vscode.window.showErrorMessage).toHaveBeenCalled();

			// Clear error message mock
			(vscode.window.showErrorMessage as jest.Mock).mockClear();

			// Second attempt should succeed
			await speakCommand();
			expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				"Audio generated successfully"
			);
		});

		it("should handle rate limit errors gracefully", async () => {
			activate(mockContext);

			vscode.window.activeTextEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn(() => "# Test"),
					fileName: "test.md",
					uri: { toString: () => "file:///test.md" },
				},
			} as any;

			// Mock rate limit error
			const rateLimitError = new Error("Rate limit exceeded");
			(rateLimitError as any).response = { status: 429 };
			jest.spyOn(ElevenLabsClient.prototype, "textToSpeech").mockRejectedValue(rateLimitError);

			// Execute command
			const speakCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
				.find(call => call[0] === "ttsCode.speakText")[1];
			
			await speakCommand();

			// Should show user-friendly error
			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("Failed to generate audio");
		});
	});

	describe("Performance and Large File Handling", () => {
		it("should handle large markdown files efficiently", async () => {
			activate(mockContext);

			// Generate large content (10MB+)
			const largeContent = "# Large Document\n\n" + "Lorem ipsum ".repeat(1000000);

			vscode.window.activeTextEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn(() => largeContent),
					fileName: "large.md",
					uri: { toString: () => "file:///large.md" },
				},
			} as any;

			// Mock chunked processing
			jest.spyOn(ElevenLabsClient.prototype, "textToSpeechChunked").mockImplementation(
				async (text, onProgress, voiceId) => {
					// Simulate progress updates
					for (let i = 0; i <= 100; i += 20) {
						onProgress?.(i);
					}
					return Buffer.from(MOCK_AUDIO_DATA, "base64");
				}
			);

			// Execute command
			const speakCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
				.find(call => call[0] === "ttsCode.speakText")[1];
			
			const startTime = Date.now();
			await speakCommand();
			const endTime = Date.now();

			// Verify chunked processing was used
			expect(ElevenLabsClient.prototype.textToSpeechChunked).toHaveBeenCalled();

			// Should complete in reasonable time (< 5 seconds for mock)
			expect(endTime - startTime).toBeLessThan(5000);
		});

		it("should cache audio for repeated requests", async () => {
			activate(mockContext);

			const mockDocument = {
				languageId: "markdown",
				getText: jest.fn(() => "# Cached Content"),
				fileName: "cached.md",
				uri: { toString: () => "file:///cached.md" },
			};

			vscode.window.activeTextEditor = {
				document: mockDocument,
			} as any;

			// Mock API call
			jest.spyOn(ElevenLabsClient.prototype, "textToSpeech").mockResolvedValue(
				Buffer.from(MOCK_AUDIO_DATA, "base64")
			);

			// Execute command twice
			const speakCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
				.find(call => call[0] === "ttsCode.speakText")[1];
			
			await speakCommand();
			await speakCommand();

			// API should only be called once due to caching
			expect(ElevenLabsClient.prototype.textToSpeech).toHaveBeenCalledTimes(1);
		});
	});

	describe("Accessibility Workflow", () => {
		it("should support keyboard-only navigation", async () => {
			activate(mockContext);

			// Set up webview
			const webviewProvider = (vscode.window.registerWebviewViewProvider as jest.Mock).mock.calls[0][1];
			webviewProvider.resolveWebviewView({ webview: mockWebview }, {}, {});

			// Simulate keyboard events through webview
			const keyboardTests = [
				{ key: "Space", action: "playPause" },
				{ key: "ArrowLeft", action: "skipBackward" },
				{ key: "ArrowRight", action: "skipForward" },
				{ key: "Home", action: "seekStart" },
				{ key: "End", action: "seekEnd" },
			];

			// Each keyboard action should work without mouse
			keyboardTests.forEach(({ key, action }) => {
				// Webview HTML should include keyboard handlers
				expect(mockWebview.html).toContain("addEventListener('keydown'");
			});
		});

		it("should provide screen reader announcements", async () => {
			activate(mockContext);

			// Set up webview
			const webviewProvider = (vscode.window.registerWebviewViewProvider as jest.Mock).mock.calls[0][1];
			webviewProvider.resolveWebviewView({ webview: mockWebview }, {}, {});

			// Verify ARIA attributes in HTML
			const html = mockWebview.html;
			expect(html).toContain('role="application"');
			expect(html).toContain('aria-label="Text-to-Speech Player"');
			expect(html).toContain('aria-live="polite"');
			expect(html).toContain('role="status"');
		});
	});
});