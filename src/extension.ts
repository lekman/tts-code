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

import { ApiKeyManager } from "./apiKeyManager";
import { AudioManager } from "./audioManager";
import { AuthenticationError } from "./elevenLabsClient";
import { HighlightManager } from "./highlightManager";
import { StorageManager } from "./storageManager";
import { WebviewProvider } from "./webviewProvider";

/**
 * Activates the ElevenLabs Text-to-Speech extension.
 * Registers the Speak Text command and initializes extension services.
 *
 * @param {vscode.ExtensionContext} context - The VSCode extension context for managing disposables and state.
 */
export function activate(context: vscode.ExtensionContext) {
	// Initialize managers with proper dependencies
	const apiKeyManager = new ApiKeyManager(context);
	const storageManager = new StorageManager(context);
	const audioManager = new AudioManager();
	const highlightManager = new HighlightManager();
	const webviewProvider = new WebviewProvider(context);

	// Mark storageManager as used (will be used in later tasks)
	void storageManager;

	// Connect AudioManager with WebviewProvider
	audioManager.setWebviewProvider(webviewProvider);

	// Handle webview messages
	webviewProvider.onDidReceiveMessage((message) => {
		switch (message.type) {
			case "playClicked":
				if (audioManager.getCurrentAudioData()) {
					audioManager.resume();
				}
				break;
			case "pauseClicked":
				audioManager.pause();
				break;
			case "stopClicked":
				audioManager.stop();
				break;
			case "skipBackClicked":
				audioManager.skipBackward();
				break;
			case "skipForwardClicked":
				audioManager.skipForward();
				break;
			case "timeUpdate":
				if (message.position !== undefined) {
					audioManager.updatePosition(message.position);
				}
				break;
			case "audioLoaded":
				if (message.duration !== undefined) {
					// Update duration in audio manager
					const currentAudioData = audioManager.getCurrentAudioData();
					if (currentAudioData) {
						audioManager.play(currentAudioData, 0);
					}
				}
				break;
			case "ended":
				audioManager.stop();
				break;
		}
	});

	// Store managers in context for disposal
	context.subscriptions.push(
		{ dispose: () => audioManager.dispose() },
		{ dispose: () => highlightManager.dispose() },
		{ dispose: () => webviewProvider.dispose() }
	);

	// Register commands
	const speakTextCommand = vscode.commands.registerCommand(
		"ttsCode.speakText",
		async () => {
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

			// Ensure we have an API key
			const apiKey = await apiKeyManager.ensureApiKey();
			if (!apiKey) {
				return;
			}

			// Initialize audio manager with API key
			audioManager.initialize(apiKey);

			try {
				await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: "Generating audio...",
						cancellable: false,
					},
					async () => {
						// Generate audio
						const audioData = await audioManager.generateAudio(
							text,
							document.uri.toString()
						);

						// Set active editor for highlighting
						highlightManager.setActiveEditor(editor);

						// Play the audio
						audioManager.play(audioData);

						// Show the webview panel
						await vscode.commands.executeCommand(
							"workbench.view.extension.ttsCodeView"
						);

						vscode.window.showInformationMessage(
							`Audio generated and loaded for playback`
						);
					}
				);
			} catch (error) {
				if (error instanceof AuthenticationError) {
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
					vscode.window.showErrorMessage(`Failed to generate audio: ${error}`);
				}
			}
		}
	);

	const speakSelectionCommand = vscode.commands.registerCommand(
		"ttsCode.speakSelection",
		async () => {
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

			// Ensure we have an API key
			const apiKey = await apiKeyManager.ensureApiKey();
			if (!apiKey) {
				return;
			}

			// Initialize audio manager with API key
			audioManager.initialize(apiKey);

			try {
				await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: "Generating audio for selection...",
						cancellable: false,
					},
					async () => {
						// Generate audio for selection
						const selectionKey = `${editor.document.uri.toString()}_selection_${selection.start.line}_${selection.start.character}_${selection.end.line}_${selection.end.character}`;
						const audioData = await audioManager.generateAudio(
							selectedText,
							selectionKey
						);

						// Set active editor for highlighting
						highlightManager.setActiveEditor(editor);
						highlightManager.highlightRange(
							new vscode.Range(selection.start, selection.end)
						);

						// Play the audio
						audioManager.play(audioData);

						// Show the webview panel
						await vscode.commands.executeCommand(
							"workbench.view.extension.ttsCodeView"
						);

						vscode.window.showInformationMessage(
							`Audio generated for selection and loaded for playback`
						);
					}
				);
			} catch (error) {
				if (error instanceof AuthenticationError) {
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
					vscode.window.showErrorMessage(`Failed to generate audio: ${error}`);
				}
			}
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
	// Cleanup is handled by the disposables in context.subscriptions
	// The managers' dispose methods will be called automatically
}
