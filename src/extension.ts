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

import { AudioManager } from "./audioManager";
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
	const storageManager = new StorageManager(context);
	const audioManager = new AudioManager();
	const highlightManager = new HighlightManager();
	const webviewProvider = new WebviewProvider(context);

	// TODO: Pass storageManager to audioManager when constructor is updated
	// For now, mark as intentionally unused
	void storageManager;

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

			try {
				await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: "Generating audio...",
						cancellable: false,
					},
					async () => {
						// TODO: Generate audio when AudioManager is fully implemented
						// const audioData = await audioManager.generateAudio(text, document.uri.toString());
						// highlightManager.setActiveEditor(editor);
						// webviewProvider.sendAudioToWebview(audioData, document.fileName);

						// For now, just show a message
						vscode.window.showInformationMessage(
							`[TTS] Would speak ${text.length} characters from ${document.fileName}`
						);
					}
				);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to generate audio: ${error}`);
			}
		}
	);

	const speakSelectionCommand = vscode.commands.registerCommand(
		"ttsCode.speakSelection",
		() => {
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

			vscode.window.showInformationMessage(
				`[TTS] Speaking selection: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? "..." : ""}"`
			);
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

	context.subscriptions.push(
		speakTextCommand,
		speakSelectionCommand,
		pauseResumeCommand,
		skipForwardCommand,
		skipBackwardCommand,
		exportAudioCommand
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
