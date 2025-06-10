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
import { activate, deactivate } from "../../src/extension";
import { ApiKeyManager } from "../../src/apiKeyManager";
import { AudioManager } from "../../src/audioManager";
import { WebviewProvider } from "../../src/webviewProvider";

describe("Extension Integration Tests", () => {
	let mockContext: vscode.ExtensionContext;
	let mockCommands: Map<string, (...args: any[]) => any>;
	let mockWebviewProviders: Map<string, vscode.WebviewViewProvider>;

	beforeEach(() => {
		// Reset mocks
		mockCommands = new Map();
		mockWebviewProviders = new Map();

		// Mock VS Code API
		(global as any).vscode = {
			commands: {
				registerCommand: jest.fn((command: string, callback: (...args: any[]) => any) => {
					mockCommands.set(command, callback);
					return { dispose: jest.fn() };
				}),
				executeCommand: jest.fn(async (command: string, ...args: any[]) => {
					const handler = mockCommands.get(command);
					if (handler) {
						return await handler(...args);
					}
				}),
				getCommands: jest.fn(async () => Array.from(mockCommands.keys())),
			},
			window: {
				showInformationMessage: jest.fn(),
				showWarningMessage: jest.fn(),
				showErrorMessage: jest.fn(),
				showInputBox: jest.fn(),
				activeTextEditor: undefined,
				createOutputChannel: jest.fn(() => ({
					appendLine: jest.fn(),
					show: jest.fn(),
					dispose: jest.fn(),
				})),
				registerWebviewViewProvider: jest.fn((viewType: string, provider: vscode.WebviewViewProvider) => {
					mockWebviewProviders.set(viewType, provider);
					return { dispose: jest.fn() };
				}),
				withProgress: jest.fn(async (options, task) => {
					return await task({ report: jest.fn() }, { isCancellationRequested: false });
				}),
			},
			workspace: {
				getConfiguration: jest.fn(() => ({
					get: jest.fn((key: string, defaultValue?: any) => defaultValue),
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
				get: jest.fn(),
				store: jest.fn(),
				delete: jest.fn(),
			},
			extensionUri: { fsPath: "/mock/extension/path" },
			globalState: {
				get: jest.fn(),
				update: jest.fn(),
			},
			workspaceState: {
				get: jest.fn(),
				update: jest.fn(),
			},
		} as any;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("Extension Lifecycle", () => {
		it("should activate and register all commands", async () => {
			// Activate extension
			activate(mockContext);

			// Verify commands were registered
			const registeredCommands = await vscode.commands.getCommands();
			expect(registeredCommands).toContain("ttsCode.speakText");
			expect(registeredCommands).toContain("ttsCode.speakSelection");
			expect(registeredCommands).toContain("ttsCode.pauseResume");
			expect(registeredCommands).toContain("ttsCode.skipForward");
			expect(registeredCommands).toContain("ttsCode.skipBackward");
			expect(registeredCommands).toContain("ttsCode.exportAudio");
			expect(registeredCommands).toContain("ttsCode.resetApiKey");
		});

		it("should register webview provider", () => {
			activate(mockContext);

			// Verify webview provider was registered
			expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith(
				WebviewProvider.viewType,
				expect.any(WebviewProvider)
			);
		});

		it("should add disposables to subscriptions", () => {
			activate(mockContext);

			// Verify disposables were added
			expect(mockContext.subscriptions.length).toBeGreaterThan(0);
		});

		it("should handle deactivation gracefully", () => {
			activate(mockContext);
			
			// Should not throw
			expect(() => deactivate()).not.toThrow();
		});
	});

	describe("Command Integration", () => {
		beforeEach(() => {
			activate(mockContext);
		});

		it("should handle speakText command with no active editor", async () => {
			vscode.window.activeTextEditor = undefined;

			await vscode.commands.executeCommand("ttsCode.speakText");

			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("No active text editor");
		});

		it("should handle speakText command with unsupported file type", async () => {
			vscode.window.activeTextEditor = {
				document: {
					languageId: "javascript",
					getText: jest.fn(() => "console.log('test');"),
				},
			} as any;

			await vscode.commands.executeCommand("ttsCode.speakText");

			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
				"Only markdown and text files are supported"
			);
		});

		it("should handle speakText command with empty document", async () => {
			vscode.window.activeTextEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn(() => ""),
				},
			} as any;

			await vscode.commands.executeCommand("ttsCode.speakText");

			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("Document is empty");
		});

		it("should handle speakSelection command with no selection", async () => {
			vscode.window.activeTextEditor = {
				selection: { isEmpty: true },
				document: {
					getText: jest.fn(() => ""),
				},
			} as any;

			await vscode.commands.executeCommand("ttsCode.speakSelection");

			expect(vscode.window.showWarningMessage).toHaveBeenCalledWith("No text selected!");
		});

		it("should handle resetApiKey command", async () => {
			const mockApiKeyManager = {
				resetApiKey: jest.fn(),
			};

			// Mock the ApiKeyManager instance
			jest.spyOn(ApiKeyManager.prototype, "resetApiKey").mockImplementation(mockApiKeyManager.resetApiKey);

			await vscode.commands.executeCommand("ttsCode.resetApiKey");

			expect(mockApiKeyManager.resetApiKey).toHaveBeenCalled();
		});
	});

	describe("Webview Message Handling", () => {
		let webviewProvider: WebviewProvider;
		let messageHandler: (message: any) => void;

		beforeEach(() => {
			activate(mockContext);
			
			// Get the registered webview provider
			const registerCall = (vscode.window.registerWebviewViewProvider as jest.Mock).mock.calls[0];
			webviewProvider = registerCall[1];

			// Set up message handler spy
			const originalOnDidReceiveMessage = webviewProvider.onDidReceiveMessage;
			webviewProvider.onDidReceiveMessage = jest.fn((handler) => {
				messageHandler = handler;
				return originalOnDidReceiveMessage(handler);
			});
		});

		it("should handle playing message", () => {
			const mockAudioManager = {
				resume: jest.fn(),
			};
			jest.spyOn(AudioManager.prototype, "resume").mockImplementation(mockAudioManager.resume);

			// Simulate webview sending playing message
			if (messageHandler) {
				messageHandler({ type: "playing" });
			}

			expect(mockAudioManager.resume).toHaveBeenCalled();
		});

		it("should handle paused message", () => {
			const mockAudioManager = {
				pause: jest.fn(),
			};
			jest.spyOn(AudioManager.prototype, "pause").mockImplementation(mockAudioManager.pause);

			// Simulate webview sending paused message
			if (messageHandler) {
				messageHandler({ type: "paused" });
			}

			expect(mockAudioManager.pause).toHaveBeenCalled();
		});

		it("should handle timeUpdate message", () => {
			const mockAudioManager = {
				updatePosition: jest.fn(),
				getCurrentDuration: jest.fn(() => 100),
			};
			const mockHighlightManager = {
				highlightAtTimestamp: jest.fn(),
			};

			jest.spyOn(AudioManager.prototype, "updatePosition").mockImplementation(mockAudioManager.updatePosition);
			jest.spyOn(AudioManager.prototype, "getCurrentDuration").mockImplementation(mockAudioManager.getCurrentDuration);

			// Simulate webview sending timeUpdate message
			if (messageHandler) {
				messageHandler({ type: "timeUpdate", position: 50 });
			}

			expect(mockAudioManager.updatePosition).toHaveBeenCalledWith(50);
		});

		it("should handle ended message", () => {
			const mockAudioManager = {
				stop: jest.fn(),
			};
			const mockHighlightManager = {
				clearHighlights: jest.fn(),
			};

			jest.spyOn(AudioManager.prototype, "stop").mockImplementation(mockAudioManager.stop);

			// Simulate webview sending ended message
			if (messageHandler) {
				messageHandler({ type: "ended" });
			}

			expect(mockAudioManager.stop).toHaveBeenCalled();
		});
	});

	describe("Error Handling Integration", () => {
		beforeEach(() => {
			activate(mockContext);
		});

		it("should handle API key validation errors", async () => {
			// Mock API key manager to return no key
			mockContext.secrets.get = jest.fn().mockResolvedValue(undefined);
			
			// Mock showInputBox to simulate user cancellation
			vscode.window.showInputBox = jest.fn().mockResolvedValue(undefined);

			vscode.window.activeTextEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn(() => "# Test Document"),
					fileName: "test.md",
					uri: { toString: () => "file:///test.md" },
				},
			} as any;

			await vscode.commands.executeCommand("ttsCode.speakText");

			// Should prompt for API key
			expect(vscode.window.showInputBox).toHaveBeenCalled();
		});

		it("should handle audio generation errors gracefully", async () => {
			// Mock successful API key retrieval
			mockContext.secrets.get = jest.fn().mockResolvedValue("test-api-key");

			// Mock audio generation to throw error
			const mockError = new Error("Network error");
			jest.spyOn(AudioManager.prototype, "generateAudio").mockRejectedValue(mockError);

			vscode.window.activeTextEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn(() => "# Test Document"),
					fileName: "test.md",
					uri: { toString: () => "file:///test.md" },
				},
			} as any;

			await vscode.commands.executeCommand("ttsCode.speakText");

			// Should show error message
			expect(vscode.window.showErrorMessage).toHaveBeenCalled();
		});
	});

	describe("Extension State Management", () => {
		it("should properly initialize logger on activation", () => {
			const mockLogger = {
				initialize: jest.fn(),
				info: jest.fn(),
			};

			// Mock Logger static methods
			jest.mock("../../src/logger", () => ({
				Logger: mockLogger,
			}));

			activate(mockContext);

			// Logger should be initialized
			expect(vscode.window.createOutputChannel).toHaveBeenCalledWith("ElevenLabs TTS");
		});

		it("should handle concurrent command executions", async () => {
			activate(mockContext);

			// Set up editor with markdown content
			vscode.window.activeTextEditor = {
				document: {
					languageId: "markdown",
					getText: jest.fn(() => "# Test Document"),
					fileName: "test.md",
					uri: { toString: () => "file:///test.md" },
				},
			} as any;

			// Mock API key
			mockContext.secrets.get = jest.fn().mockResolvedValue("test-api-key");

			// Execute multiple commands concurrently
			const promises = [
				vscode.commands.executeCommand("ttsCode.speakText"),
				vscode.commands.executeCommand("ttsCode.speakText"),
			];

			// Should handle without errors
			await expect(Promise.all(promises)).resolves.not.toThrow();
		});
	});
});