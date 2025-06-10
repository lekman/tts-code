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

import * as crypto from "crypto";

import * as vscode from "vscode";

import { ApiKeyManager } from "./apiKeyManager";
import { AudioManager } from "./audioManager";
import { AuthenticationError } from "./elevenLabsClient";
import { HighlightManager } from "./highlightManager";
import { Logger, ErrorHandler } from "./logger";
import { isMarkdownFile, markdownToPlainText } from "./markdownUtils";
import { StorageManager } from "./storageManager";
import { WebviewProvider } from "./webviewProvider";

/**
 * Activates the ElevenLabs Text-to-Speech extension.
 * Registers the Speak Text command and initializes extension services.
 *
 * @param {vscode.ExtensionContext} context - The VSCode extension context for managing disposables and state.
 */
export function activate(context: vscode.ExtensionContext) {
	// Initialize logger first
	Logger.initialize();
	Logger.info("ElevenLabs TTS extension activated");

	// Initialize managers with proper dependencies
	const apiKeyManager = new ApiKeyManager(context);
	const storageManager = new StorageManager(context);
	const audioManager = new AudioManager();
	const highlightManager = new HighlightManager();
	const webviewProvider = new WebviewProvider(
		context,
		audioManager,
		highlightManager
	);

	// Mark storageManager as used (will be used in later tasks)
	void storageManager;

	// Connect AudioManager with WebviewProvider
	audioManager.setWebviewProvider(webviewProvider);

	// Handle webview messages
	webviewProvider.onDidReceiveMessage((message) => {
		switch (message.type) {
			case "playing":
				// Update audio manager state when webview starts playing
				audioManager.resume();
				break;
			case "paused":
				audioManager.pause();
				break;
			case "timeUpdate":
				if (message.position !== undefined) {
					audioManager.updatePosition(message.position);

					// Update highlighting based on playback position
					const duration = audioManager.getCurrentDuration();
					if (duration > 0) {
						highlightManager.highlightAtTimestamp(message.position, duration);
					}
				}
				break;
			case "seeked":
				if (message.position !== undefined) {
					audioManager.updatePosition(message.position);

					// Update highlighting when user seeks
					const duration = audioManager.getCurrentDuration();
					if (duration > 0) {
						highlightManager.highlightAtTimestamp(message.position, duration);
					}
				}
				break;
			case "ended":
				audioManager.stop();
				highlightManager.clearHighlights();
				break;
		}
	});

	// Store managers in context for disposal
	context.subscriptions.push(
		{ dispose: () => audioManager.dispose() },
		{ dispose: () => highlightManager.dispose() },
		{ dispose: () => webviewProvider.dispose() },
		{ dispose: () => Logger.dispose() }
	);

	// Register commands
	const speakTextCommand = vscode.commands.registerCommand(
		"ttsCode.speakText",
		async () => {
			await ErrorHandler.withErrorHandling(async () => {
				Logger.debug("Speak text command triggered");

				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					vscode.window.showErrorMessage("No active text editor");
					return;
				}

				const document = editor.document;
				if (
					document.languageId !== "markdown" &&
					document.languageId !== "plaintext"
				) {
					vscode.window.showErrorMessage(
						"Only markdown and text files are supported"
					);
					return;
				}

				const text = document.getText();
				if (!text) {
					vscode.window.showErrorMessage("Document is empty");
					return;
				}

				// Process markdown to plain text if needed
				let processedText = text;
				if (isMarkdownFile(document.fileName)) {
					processedText = markdownToPlainText(text);
				}

				// Ensure we have an API key
				const apiKey = await apiKeyManager.ensureApiKey();
				if (!apiKey) {
					return;
				}

				// Initialize audio manager with API key
				audioManager.initialize(apiKey);

				Logger.info(
					`Starting audio generation for document: ${document.fileName}`
				);

				try {
					// Show the webview panel first
					await vscode.commands.executeCommand(
						"workbench.view.extension.ttsCodeView"
					);

					// Clear any previous audio
					webviewProvider.postMessage({ type: "clearAudio" });

					await vscode.window.withProgress(
						{
							location: vscode.ProgressLocation.Notification,
							title: "Generating audio...",
							cancellable: false,
						},
						async () => {
							// Create a cache key that includes content hash of the processed text
							const contentHash = crypto
								.createHash("md5")
								.update(processedText)
								.digest("hex");
							const cacheKey = `${document.uri.toString()}_${contentHash}`;

							// Generate audio with processed text
							const audioData = await audioManager.generateAudio(
								processedText,
								cacheKey
							);

							// Set active editor for highlighting
							highlightManager.setActiveEditor(editor);

							// Show success notification
							vscode.window.showInformationMessage(
								`Audio generated successfully`
							);

							Logger.info("Audio generation completed successfully");

							// Add a small delay to ensure webview is ready
							await new Promise<void>((resolve) => {
								setTimeout(() => resolve(), 100);
							});

							// Play the audio
							audioManager.play(audioData);
						}
					);
				} catch (error) {
					if (error instanceof AuthenticationError) {
						Logger.error(
							"Authentication error during audio generation",
							error as Error
						);
						// Show warning and automatically trigger API key reset
						vscode.window
							.showWarningMessage(
								"Invalid API key detected. Please enter a new API key.",
								"Reset API Key"
							)
							.then((buttonSelection) => {
								if (buttonSelection === "Reset API Key") {
									vscode.commands.executeCommand("ttsCode.resetApiKey");
								}
							});
					} else {
						throw error; // Re-throw to be handled by ErrorHandler
					}
				}
			}, "Failed to generate audio");
		}
	);

	const speakSelectionCommand = vscode.commands.registerCommand(
		"ttsCode.speakSelection",
		async () => {
			await ErrorHandler.withErrorHandling(async () => {
				Logger.debug("Speak selection command triggered");

				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					vscode.window.showWarningMessage("No active editor!");
					return;
				}

				const selection = editor.selection;
				const selectedText = editor.document.getText(selection);

				if (!selectedText) {
					vscode.window.showWarningMessage("No text selected!");
					return;
				}

				// Process markdown to plain text if needed
				let processedText = selectedText;
				if (isMarkdownFile(editor.document.fileName)) {
					processedText = markdownToPlainText(selectedText);
				}

				// Ensure we have an API key
				const apiKey = await apiKeyManager.ensureApiKey();
				if (!apiKey) {
					return;
				}

				// Initialize audio manager with API key
				audioManager.initialize(apiKey);

				Logger.info(
					`Starting audio generation for selection in: ${editor.document.fileName}`
				);

				try {
					// Show the webview panel first
					await vscode.commands.executeCommand(
						"workbench.view.extension.ttsCodeView"
					);

					// Clear any previous audio
					webviewProvider.postMessage({ type: "clearAudio" });

					await vscode.window.withProgress(
						{
							location: vscode.ProgressLocation.Notification,
							title: "Generating audio for selection...",
							cancellable: false,
						},
						async () => {
							// Create a cache key that includes content hash of the processed text
							const contentHash = crypto
								.createHash("md5")
								.update(processedText)
								.digest("hex");
							const cacheKey = `${editor.document.uri.toString()}_selection_${contentHash}`;

							// Generate audio for selection with processed text
							const audioData = await audioManager.generateAudio(
								processedText,
								cacheKey
							);

							// Set active editor for highlighting
							highlightManager.setActiveEditor(editor);
							highlightManager.highlightRange(
								new vscode.Range(selection.start, selection.end)
							);

							// Show success notification
							vscode.window.showInformationMessage(
								`Audio generated successfully for selection`
							);

							Logger.info(
								"Audio generation completed successfully for selection"
							);

							// Add a small delay to ensure webview is ready
							await new Promise<void>((resolve) => {
								setTimeout(() => resolve(), 100);
							});

							// Play the audio
							audioManager.play(audioData);
						}
					);
				} catch (error) {
					if (error instanceof AuthenticationError) {
						Logger.error(
							"Authentication error during audio generation",
							error as Error
						);
						// Show warning and automatically trigger API key reset
						vscode.window
							.showWarningMessage(
								"Invalid API key detected. Please enter a new API key.",
								"Reset API Key"
							)
							.then((buttonSelection) => {
								if (buttonSelection === "Reset API Key") {
									vscode.commands.executeCommand("ttsCode.resetApiKey");
								}
							});
					} else {
						throw error; // Re-throw to be handled by ErrorHandler
					}
				}
			}, "Failed to generate audio for selection");
		}
	);

	const pauseResumeCommand = vscode.commands.registerCommand(
		"ttsCode.pauseResume",
		() => {
			vscode.window.showInformationMessage(
				"[TTS] Pause/Resume playback - Not yet implemented."
			);
		}
	);

	const skipForwardCommand = vscode.commands.registerCommand(
		"ttsCode.skipForward",
		() => {
			vscode.window.showInformationMessage(
				"[TTS] Skip forward - Not yet implemented."
			);
		}
	);

	const skipBackwardCommand = vscode.commands.registerCommand(
		"ttsCode.skipBackward",
		() => {
			vscode.window.showInformationMessage(
				"[TTS] Skip backward - Not yet implemented."
			);
		}
	);

	const exportAudioCommand = vscode.commands.registerCommand(
		"ttsCode.exportAudio",
		() => {
			vscode.window.showInformationMessage(
				"[TTS] Export audio - Not yet implemented."
			);
		}
	);

	const resetApiKeyCommand = vscode.commands.registerCommand(
		"ttsCode.resetApiKey",
		async () => {
			await apiKeyManager.resetApiKey();
		}
	);

	context.subscriptions.push(
		speakTextCommand,
		speakSelectionCommand,
		pauseResumeCommand,
		skipForwardCommand,
		skipBackwardCommand,
		exportAudioCommand,
		resetApiKeyCommand
	);

	// Register the webview provider (if needed)
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			WebviewProvider.viewType,
			webviewProvider
		)
	);
}

/**
 * Deactivates the ElevenLabs Text-to-Speech extension.
 * Used for cleanup when the extension is unloaded.
 *
 * @returns {void}
 */
export function deactivate(): void {
	Logger.info("ElevenLabs TTS extension deactivated");
	// Cleanup is handled by the disposables in context.subscriptions
	// The managers' dispose methods will be called automatically
}
