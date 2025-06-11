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
import * as path from "path";

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
			case "export":
				if (message.format) {
					// Execute the export command with the specified format
					vscode.commands.executeCommand("ttsCode.exportAudio", message.format);
				}
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

				// Check file size (50MB limit)
				const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
				const fileSize = Buffer.byteLength(text, "utf8");
				if (fileSize > MAX_FILE_SIZE) {
					vscode.window.showErrorMessage(
						`File is too large (${(fileSize / 1024 / 1024).toFixed(2)}MB). Maximum supported size is 50MB.`
					);
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
						async (progress) => {
							// Create a cache key that includes content hash of the processed text
							const contentHash = crypto
								.createHash("md5")
								.update(processedText)
								.digest("hex");
							const cacheKey = `${document.uri.toString()}_${contentHash}`;

							// Get selected voice from settings
							const config =
								vscode.workspace.getConfiguration("elevenlabs-tts");
							const voiceId = config.get<string>("voiceId");

							// Generate audio with chunking and progress reporting
							const audioData = await audioManager.generateAudioChunked(
								processedText,
								cacheKey,
								voiceId, // Use selected voice from settings
								(progressPercent, message) => {
									progress.report({
										increment: progressPercent,
										message: message,
									});
								}
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
						async (progress) => {
							// Create a cache key that includes content hash of the processed text
							const contentHash = crypto
								.createHash("md5")
								.update(processedText)
								.digest("hex");
							const cacheKey = `${editor.document.uri.toString()}_selection_${contentHash}`;

							// Get selected voice from settings
							const config =
								vscode.workspace.getConfiguration("elevenlabs-tts");
							const voiceId = config.get<string>("voiceId");

							// Generate audio for selection with chunking and progress
							const audioData = await audioManager.generateAudioChunked(
								processedText,
								cacheKey,
								voiceId, // Use selected voice from settings
								(progressPercent, message) => {
									progress.report({
										increment: progressPercent,
										message: message,
									});
								}
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
		async (preSelectedFormat?: string) => {
			await ErrorHandler.withErrorHandling(async () => {
				Logger.debug("Export audio command triggered");

				// Check if we have current audio data
				const currentAudioData = audioManager.getCurrentAudioData();
				if (!currentAudioData) {
					vscode.window.showWarningMessage(
						"No audio to export. Please generate audio first."
					);
					return;
				}

				// Get the active editor for filename
				const editor = vscode.window.activeTextEditor;
				const fileName = editor
					? path.basename(
							editor.document.fileName,
							path.extname(editor.document.fileName)
						)
					: "tts_audio";

				// Use pre-selected format if provided, otherwise ask user
				let format = preSelectedFormat;
				if (!format) {
					format = await vscode.window.showQuickPick(["mp3", "wav"], {
						placeHolder: "Select audio format",
						title: "Export Audio",
					});

					if (!format) {
						return; // User cancelled
					}
				}

				// Save the audio file
				const savedUri = await storageManager.saveAudioFile(
					currentAudioData,
					fileName,
					format as "mp3" | "wav"
				);

				if (savedUri) {
					Logger.info(`Audio exported successfully to: ${savedUri.fsPath}`);
				}
			}, "Failed to export audio");
		}
	);

	const resetApiKeyCommand = vscode.commands.registerCommand(
		"ttsCode.resetApiKey",
		async () => {
			await apiKeyManager.resetApiKey();
		}
	);

	const updateVoiceListCommand = vscode.commands.registerCommand(
		"ttsCode.updateVoiceList",
		async () => {
			await ErrorHandler.withErrorHandling(async () => {
				Logger.debug("Update voice list command triggered");

				// Ensure we have an API key
				const apiKey = await apiKeyManager.ensureApiKey();
				if (!apiKey) {
					return;
				}

				// Initialize audio manager with API key
				audioManager.initialize(apiKey);

				await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: "Fetching available voices...",
						cancellable: false,
					},
					async () => {
						try {
							// Get voices from ElevenLabs
							const voices = await audioManager.getAvailableVoices();

							if (!voices || voices.length === 0) {
								vscode.window.showWarningMessage("No voices available");
								return;
							}

							// Get current configuration
							const config = vscode.workspace.getConfiguration();

							// Show quick pick to let user select a voice
							const items = voices.map((voice) => ({
								label: voice.name,
								description: voice.labels
									? Object.values(voice.labels).join(", ")
									: "",
								detail: voice.description,
								voiceId: voice.voiceId,
							}));

							const selected = await vscode.window.showQuickPick(items, {
								placeHolder: "Select a voice to use",
								title: "Choose Voice",
							});

							if (selected) {
								// Update the selected voice in settings
								await config.update(
									"elevenlabs-tts.voiceId",
									selected.voiceId,
									vscode.ConfigurationTarget.Global
								);
								vscode.window.showInformationMessage(
									`Voice changed to: ${selected.label}`
								);
								Logger.info(
									`Voice changed to: ${selected.label} (${selected.voiceId})`
								);
							}
						} catch (error) {
							if (error instanceof AuthenticationError) {
								vscode.window.showErrorMessage(
									"Invalid API key. Please reset your API key."
								);
							} else {
								throw error;
							}
						}
					}
				);
			}, "Failed to update voice list");
		}
	);

	context.subscriptions.push(
		speakTextCommand,
		speakSelectionCommand,
		pauseResumeCommand,
		skipForwardCommand,
		skipBackwardCommand,
		exportAudioCommand,
		resetApiKeyCommand,
		updateVoiceListCommand
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
