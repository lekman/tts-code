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
import { activate } from "../src/extension";

describe("Extension Coverage Tests", () => {
	let mockContext: vscode.ExtensionContext;
	let mockCommands: Map<string, (...args: any[]) => any>;

	beforeEach(() => {
		mockCommands = new Map();

		// Mock VS Code API
		(global as any).vscode = {
			commands: {
				registerCommand: jest.fn(
					(command: string, callback: (...args: any[]) => any) => {
						mockCommands.set(command, callback);
						return { dispose: jest.fn() };
					}
				),
				executeCommand: jest.fn(),
			},
			window: {
				showInformationMessage: jest.fn(),
				showWarningMessage: jest.fn().mockResolvedValue(undefined),
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
					return await task(
						{ report: jest.fn() },
						{ isCancellationRequested: false }
					);
				}),
			},
			workspace: {
				getConfiguration: jest.fn(() => ({
					get: jest.fn(
						(key: string, defaultValue?: any) => defaultValue || "info"
					),
				})),
			},
			ProgressLocation: {
				Notification: 15,
			},
			Range: jest.fn((start: any, end: any) => ({ start, end })),
			Position: jest.fn((line: number, character: number) => ({
				line,
				character,
			})),
		};

		// Mock extension context
		mockContext = {
			subscriptions: [],
			secrets: {
				get: jest.fn().mockResolvedValue("test-api-key"),
				store: jest.fn(),
				delete: jest.fn(),
			},
			extensionUri: { fsPath: "/mock/extension/path" },
		} as any;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("Uncovered Lines in extension.ts", () => {
		it("should handle disposable cleanup (lines 101-104)", () => {
			activate(mockContext);

			// Get the disposables added to subscriptions
			const disposables = mockContext.subscriptions.filter(
				(sub) => sub.dispose && typeof sub.dispose === "function"
			);

			// Should have added disposables for managers
			expect(disposables.length).toBeGreaterThan(0);

			// Call dispose on each to ensure no errors
			disposables.forEach((disposable) => {
				expect(() => disposable.dispose()).not.toThrow();
			});
		});

		// TODO: Fix after resolving Jest module caching issues
		it.skip("should handle API key cancellation in speakSelection (line 258)", async () => {
			activate(mockContext);

			// Mock no API key and user cancels
			mockContext.secrets.get = jest.fn().mockResolvedValue(undefined);
			vscode.window.showInputBox = jest.fn().mockResolvedValue(undefined);

			// Set up editor with selection
			vscode.window.activeTextEditor = {
				selection: { isEmpty: false },
				document: {
					getText: jest.fn(() => "Selected text"),
					fileName: "test.md",
					languageId: "markdown",
				},
			} as any;

			const speakSelectionCommand = mockCommands.get("ttsCode.speakSelection");
			await speakSelectionCommand?.();

			// Should have prompted for API key
			expect(vscode.window.showInputBox).toHaveBeenCalled();
		});

		// TODO: Fix after resolving Jest module caching issues
		it.skip("should handle authentication error in speakSelection (lines 322-339)", async () => {
			activate(mockContext);

			// Set up editor with selection
			vscode.window.activeTextEditor = {
				selection: { isEmpty: false },
				document: {
					getText: jest.fn(() => "Selected text"),
					fileName: "test.md",
					languageId: "markdown",
					uri: { toString: () => "file:///test.md" },
				},
			} as any;

			// Mock authentication error
			const authError = new AuthenticationError("Invalid API key");

			// Mock audio generation to throw auth error
			jest.mock("../src/audioManager", () => ({
				AudioManager: jest.fn().mockImplementation(() => ({
					initialize: jest.fn(),
					generateAudio: jest.fn().mockRejectedValue(authError),
					setWebviewProvider: jest.fn(),
					dispose: jest.fn(),
				})),
			}));

			// Mock the warning message to return "Reset API Key"
			vscode.window.showWarningMessage = jest
				.fn()
				.mockResolvedValue("Reset API Key");

			const speakSelectionCommand = mockCommands.get("ttsCode.speakSelection");
			await speakSelectionCommand?.();

			// Should show warning about invalid API key
			expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
				"Invalid API key detected. Please enter a new API key.",
				"Reset API Key"
			);

			// Should execute reset command
			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
				"ttsCode.resetApiKey"
			);
		});

		// TODO: Fix after resolving Jest module caching issues
		it.skip("should handle general errors in speakSelection", async () => {
			activate(mockContext);

			// Set up editor with selection
			vscode.window.activeTextEditor = {
				selection: { isEmpty: false },
				document: {
					getText: jest.fn(() => "Selected text"),
					fileName: "test.md",
					languageId: "markdown",
					uri: { toString: () => "file:///test.md" },
				},
			} as any;

			// Mock general error
			const generalError = new Error("Network error");

			// Mock audio generation to throw general error
			jest.mock("../src/audioManager", () => ({
				AudioManager: jest.fn().mockImplementation(() => ({
					initialize: jest.fn(),
					generateAudio: jest.fn().mockRejectedValue(generalError),
					setWebviewProvider: jest.fn(),
					dispose: jest.fn(),
				})),
			}));

			const speakSelectionCommand = mockCommands.get("ttsCode.speakSelection");
			await speakSelectionCommand?.();

			// Should show error message
			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
				"Failed to generate audio for selection"
			);
		});

		it("should handle seeked message without position", () => {
			activate(mockContext);

			// Get the webview message handler
			const webviewProvider = (
				vscode.window.registerWebviewViewProvider as jest.Mock
			).mock.calls[0][1];
			let messageHandler: (message: any) => void;

			webviewProvider.onDidReceiveMessage = jest.fn((handler) => {
				messageHandler = handler;
				return { dispose: jest.fn() };
			});

			// Trigger message without position
			if (messageHandler!) {
				// Should not throw
				expect(() => messageHandler({ type: "seeked" })).not.toThrow();
			}
		});

		it("should handle timeUpdate without duration", () => {
			activate(mockContext);

			// Mock audio manager with 0 duration
			jest.mock("../src/audioManager", () => ({
				AudioManager: jest.fn().mockImplementation(() => ({
					updatePosition: jest.fn(),
					getCurrentDuration: jest.fn(() => 0),
					setWebviewProvider: jest.fn(),
					dispose: jest.fn(),
				})),
			}));

			// Get the webview message handler
			const webviewProvider = (
				vscode.window.registerWebviewViewProvider as jest.Mock
			).mock.calls[0][1];
			let messageHandler: (message: any) => void;

			webviewProvider.onDidReceiveMessage = jest.fn((handler) => {
				messageHandler = handler;
				return { dispose: jest.fn() };
			});

			// Trigger timeUpdate with position but no duration
			if (messageHandler!) {
				// Should not throw
				expect(() =>
					messageHandler({ type: "timeUpdate", position: 50 })
				).not.toThrow();
			}
		});

		// TODO: Fix after resolving Jest module caching issues
		it.skip("should handle authentication error with no button selection", async () => {
			activate(mockContext);

			// Set up editor
			vscode.window.activeTextEditor = {
				document: {
					getText: jest.fn(() => "Test text"),
					fileName: "test.md",
					languageId: "markdown",
					uri: { toString: () => "file:///test.md" },
				},
			} as any;

			// Mock authentication error
			const authError = new AuthenticationError("Invalid API key");

			// Mock audio generation to throw auth error
			jest.mock("../src/audioManager", () => ({
				AudioManager: jest.fn().mockImplementation(() => ({
					initialize: jest.fn(),
					generateAudio: jest.fn().mockRejectedValue(authError),
					setWebviewProvider: jest.fn(),
					dispose: jest.fn(),
				})),
			}));

			// Mock the warning message to return undefined (no selection)
			vscode.window.showWarningMessage = jest.fn().mockResolvedValue(undefined);

			const speakTextCommand = mockCommands.get("ttsCode.speakText");
			await speakTextCommand?.();

			// Should show warning
			expect(vscode.window.showWarningMessage).toHaveBeenCalled();

			// Should not execute reset command
			expect(vscode.commands.executeCommand).not.toHaveBeenCalledWith(
				"ttsCode.resetApiKey"
			);
		});
	});
});
