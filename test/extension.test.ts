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

import { AuthenticationError } from "../src/elevenLabsClient";
import * as extension from "../src/extension";

// Mock the managers
jest.mock("../src/apiKeyManager");
jest.mock("../src/audioManager");
jest.mock("../src/highlightManager");
jest.mock("../src/storageManager");
jest.mock("../src/webviewProvider");

// Get the mocked vscode module that jest will automatically use

describe("extension", () => {
	let mockContext: any;
	let mockCommands: any[] = [];
	let mockWebviewProviders: any[] = [];
	let mockApiKeyManager: any;
	let mockAudioManager: any;
	let mockHighlightManager: any;
	let mockWebviewProvider: any;

	beforeEach(() => {
		// Clear all mocks
		jest.clearAllMocks();
		mockCommands = [];
		mockWebviewProviders = [];

		// Mock global setTimeout
		global.setTimeout = jest.fn((callback: () => void) => {
			callback();
			return 0 as any;
		}) as any;

		// Setup context
		mockContext = {
			subscriptions: [],
		};

		// Setup command registration
		(vscode.commands.registerCommand as jest.Mock).mockImplementation(
			(command, callback) => {
				const cmd = { command, callback };
				mockCommands.push(cmd);
				return cmd;
			}
		);

		// Setup webview provider registration
		(vscode.window.registerWebviewViewProvider as jest.Mock).mockImplementation(
			(viewType, provider) => {
				const registration = { viewType, provider };
				mockWebviewProviders.push(registration);
				return registration;
			}
		);

		// Setup manager mocks
		const ApiKeyManager = require("../src/apiKeyManager").ApiKeyManager;
		mockApiKeyManager = {
			ensureApiKey: jest.fn().mockResolvedValue("test-api-key"),
			resetApiKey: jest.fn(),
		};
		ApiKeyManager.mockImplementation(() => mockApiKeyManager);

		const AudioManager = require("../src/audioManager").AudioManager;
		mockAudioManager = {
			initialize: jest.fn(),
			generateAudio: jest.fn().mockResolvedValue(Buffer.from("test audio")),
			play: jest.fn(),
			pause: jest.fn(),
			resume: jest.fn(),
			stop: jest.fn(),
			skipForward: jest.fn(),
			skipBackward: jest.fn(),
			getCurrentAudioData: jest.fn(),
			getCurrentDuration: jest.fn().mockReturnValue(10),
			updatePosition: jest.fn(),
			setWebviewProvider: jest.fn(),
			dispose: jest.fn(),
		};
		AudioManager.mockImplementation(() => mockAudioManager);

		const HighlightManager =
			require("../src/highlightManager").HighlightManager;
		mockHighlightManager = {
			setActiveEditor: jest.fn(),
			highlightRange: jest.fn(),
			highlightAtTimestamp: jest.fn(),
			clearHighlights: jest.fn(),
			dispose: jest.fn(),
		};
		HighlightManager.mockImplementation(() => mockHighlightManager);

		const WebviewProvider = require("../src/webviewProvider").WebviewProvider;
		mockWebviewProvider = {
			onDidReceiveMessage: jest.fn(),
			postMessage: jest.fn(),
			dispose: jest.fn(),
		};
		WebviewProvider.mockImplementation(() => mockWebviewProvider);
		WebviewProvider.viewType = "ttsCode.webview";
	});

	it("should export an activate function", () => {
		expect(typeof extension.activate).toBe("function");
	});

	it("should export a deactivate function", () => {
		expect(typeof extension.deactivate).toBe("function");
	});

	describe("activate", () => {
		it("should register all commands", () => {
			extension.activate(mockContext);

			const commandNames = mockCommands.map((cmd) => cmd.command);
			expect(commandNames).toContain("ttsCode.speakText");
			expect(commandNames).toContain("ttsCode.speakSelection");
			expect(commandNames).toContain("ttsCode.pauseResume");
			expect(commandNames).toContain("ttsCode.skipForward");
			expect(commandNames).toContain("ttsCode.skipBackward");
			expect(commandNames).toContain("ttsCode.exportAudio");
			expect(commandNames).toContain("ttsCode.resetApiKey");
		});

		it("should register webview provider", () => {
			extension.activate(mockContext);

			expect(mockWebviewProviders).toHaveLength(1);
			expect(mockWebviewProviders[0].viewType).toBe("ttsCode.webview");
		});

		it("should setup manager connections", () => {
			extension.activate(mockContext);

			// Should connect audio manager with webview provider
			expect(mockAudioManager.setWebviewProvider).toHaveBeenCalledWith(
				mockWebviewProvider
			);

			// Should register webview message handler
			expect(mockWebviewProvider.onDidReceiveMessage).toHaveBeenCalled();
		});

		it("should add disposables to subscriptions", () => {
			extension.activate(mockContext);

			// Should have manager disposables + commands + webview provider
			expect(mockContext.subscriptions.length).toBeGreaterThan(10);
		});
	});

	describe("speakText command", () => {
		let speakTextCommand: any;

		beforeEach(() => {
			extension.activate(mockContext);
			speakTextCommand = mockCommands.find(
				(cmd) => cmd.command === "ttsCode.speakText"
			);
		});

		it("should show error when no active editor", async () => {
			(vscode.window as any).activeTextEditor = undefined;

			await speakTextCommand.callback();

			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
				"No active text editor"
			);
		});

		it("should show error for unsupported file types", async () => {
			(vscode.window as any).activeTextEditor = {
				document: {
					languageId: "javascript",
					getText: jest.fn().mockReturnValue("test"),
				},
			};

			await speakTextCommand.callback();

			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
				"Only markdown and text files are supported"
			);
		});

		it("should show error for empty document", async () => {
			(vscode.window as any).activeTextEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn().mockReturnValue(""),
				},
			};

			await speakTextCommand.callback();

			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
				"Document is empty"
			);
		});

		it("should generate and play audio for markdown file", async () => {
			const mockEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn().mockReturnValue("# Test markdown"),
					uri: { toString: () => "file://test.md" },
				},
			};
			(vscode.window as any).activeTextEditor = mockEditor;

			await speakTextCommand.callback();

			// Should ensure API key
			expect(mockApiKeyManager.ensureApiKey).toHaveBeenCalled();

			// Should initialize audio manager
			expect(mockAudioManager.initialize).toHaveBeenCalledWith("test-api-key");

			// Should generate audio
			expect(mockAudioManager.generateAudio).toHaveBeenCalledWith(
				"# Test markdown",
				"file://test.md"
			);

			// Should set active editor for highlighting
			expect(mockHighlightManager.setActiveEditor).toHaveBeenCalledWith(
				mockEditor
			);

			// Should play audio
			expect(mockAudioManager.play).toHaveBeenCalled();

			// Should show success message
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				"Audio generated successfully"
			);
		});

		it("should handle API key cancellation", async () => {
			mockApiKeyManager.ensureApiKey.mockResolvedValue(undefined);
			(vscode.window as any).activeTextEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn().mockReturnValue("test"),
				},
			};

			await speakTextCommand.callback();

			// Should not generate audio
			expect(mockAudioManager.generateAudio).not.toHaveBeenCalled();
		});

		it("should handle authentication errors", async () => {
			mockAudioManager.generateAudio.mockRejectedValue(
				new AuthenticationError("Invalid API key")
			);
			(vscode.window as any).activeTextEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn().mockReturnValue("test"),
					uri: { toString: () => "file://test.md" },
				},
			};

			// Mock the warning message to return a promise
			(vscode.window.showWarningMessage as jest.Mock).mockResolvedValue(
				"Reset API Key"
			);

			await speakTextCommand.callback();

			// Should show warning message
			expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
				"Invalid API key detected. Please enter a new API key.",
				"Reset API Key"
			);

			// Should execute reset command
			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
				"ttsCode.resetApiKey"
			);
		});

		it("should handle general errors", async () => {
			mockAudioManager.generateAudio.mockRejectedValue(
				new Error("Network error")
			);
			(vscode.window as any).activeTextEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn().mockReturnValue("test"),
					uri: { toString: () => "file://test.md" },
				},
			};

			await speakTextCommand.callback();

			// Should show error message
			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
				"Failed to generate audio: Error: Network error"
			);
		});
	});

	describe("speakSelection command", () => {
		let speakSelectionCommand: any;

		beforeEach(() => {
			extension.activate(mockContext);
			speakSelectionCommand = mockCommands.find(
				(cmd) => cmd.command === "ttsCode.speakSelection"
			);
		});

		it("should show warning when no active editor", async () => {
			(vscode.window as any).activeTextEditor = undefined;

			await speakSelectionCommand.callback();

			expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
				"No active editor!"
			);
		});

		it("should show warning when no text selected", async () => {
			(vscode.window as any).activeTextEditor = {
				selection: {},
				document: {
					getText: jest.fn().mockReturnValue(""),
				},
			};

			await speakSelectionCommand.callback();

			expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
				"No text selected!"
			);
		});

		it("should generate and play audio for selection", async () => {
			const mockSelection = {
				start: { line: 1, character: 0 },
				end: { line: 1, character: 10 },
			};
			const mockEditor = {
				selection: mockSelection,
				document: {
					getText: jest.fn().mockReturnValue("selected text"),
					uri: { toString: () => "file://test.md" },
				},
			};
			(vscode.window as any).activeTextEditor = mockEditor;

			await speakSelectionCommand.callback();

			// Should generate audio for selection
			expect(mockAudioManager.generateAudio).toHaveBeenCalledWith(
				"selected text",
				"file://test.md_selection_1_0_1_10"
			);

			// Should highlight selection
			expect(mockHighlightManager.highlightRange).toHaveBeenCalled();

			// Should play audio
			expect(mockAudioManager.play).toHaveBeenCalled();

			// Should show success message
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				"Audio generated successfully for selection"
			);
		});
	});

	describe("resetApiKey command", () => {
		let resetApiKeyCommand: any;

		beforeEach(() => {
			extension.activate(mockContext);
			resetApiKeyCommand = mockCommands.find(
				(cmd) => cmd.command === "ttsCode.resetApiKey"
			);
		});

		it("should call resetApiKey on manager", async () => {
			await resetApiKeyCommand.callback();

			expect(mockApiKeyManager.resetApiKey).toHaveBeenCalled();
		});
	});

	describe("placeholder commands", () => {
		beforeEach(() => {
			extension.activate(mockContext);
		});

		it("should show not implemented message for pauseResume", () => {
			const command = mockCommands.find(
				(cmd) => cmd.command === "ttsCode.pauseResume"
			);
			command.callback();

			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				"[TTS] Pause/Resume playback - Not yet implemented."
			);
		});

		it("should show not implemented message for skipForward", () => {
			const command = mockCommands.find(
				(cmd) => cmd.command === "ttsCode.skipForward"
			);
			command.callback();

			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				"[TTS] Skip forward - Not yet implemented."
			);
		});

		it("should show not implemented message for skipBackward", () => {
			const command = mockCommands.find(
				(cmd) => cmd.command === "ttsCode.skipBackward"
			);
			command.callback();

			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				"[TTS] Skip backward - Not yet implemented."
			);
		});

		it("should show not implemented message for exportAudio", () => {
			const command = mockCommands.find(
				(cmd) => cmd.command === "ttsCode.exportAudio"
			);
			command.callback();

			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				"[TTS] Export audio - Not yet implemented."
			);
		});
	});

	describe("webview message handling", () => {
		let messageHandler: any;

		beforeEach(() => {
			mockWebviewProvider.onDidReceiveMessage.mockImplementation((handler) => {
				messageHandler = handler;
			});
			extension.activate(mockContext);
		});

		it("should handle playing message", () => {
			messageHandler({ type: "playing" });

			expect(mockAudioManager.resume).toHaveBeenCalled();
		});

		it("should handle paused message", () => {
			messageHandler({ type: "paused" });

			expect(mockAudioManager.pause).toHaveBeenCalled();
		});

		it("should handle seeked message", () => {
			messageHandler({ type: "seeked", position: 42 });

			expect(mockAudioManager.updatePosition).toHaveBeenCalledWith(42);
			expect(mockHighlightManager.highlightAtTimestamp).toHaveBeenCalledWith(
				42,
				10
			);
		});

		it("should handle timeUpdate message", () => {
			messageHandler({ type: "timeUpdate", position: 42 });

			expect(mockAudioManager.updatePosition).toHaveBeenCalledWith(42);
			expect(mockHighlightManager.highlightAtTimestamp).toHaveBeenCalledWith(
				42,
				10
			);
		});

		it("should ignore timeUpdate without position", () => {
			messageHandler({ type: "timeUpdate" });

			expect(mockAudioManager.updatePosition).not.toHaveBeenCalled();
		});

		it("should ignore unknown message types", () => {
			// Unknown messages should be ignored without error
			messageHandler({ type: "unknown" });
			expect(mockAudioManager.pause).not.toHaveBeenCalled();
		});

		it("should handle audioLoaded message", () => {
			// audioLoaded no longer triggers play to avoid infinite loop
			messageHandler({ type: "audioLoaded", duration: 60 });

			expect(mockAudioManager.play).not.toHaveBeenCalled();
		});

		it("should handle ended message", () => {
			messageHandler({ type: "ended" });

			expect(mockAudioManager.stop).toHaveBeenCalled();
			expect(mockHighlightManager.clearHighlights).toHaveBeenCalled();
		});
	});

	describe("deactivate", () => {
		it("should call deactivate without error", () => {
			expect(() => extension.deactivate()).not.toThrow();
		});
	});
});
