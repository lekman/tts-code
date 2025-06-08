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

/**
 * Activates the ElevenLabs Text-to-Speech extension.
 * Registers commands and initializes extension services.
 *
 * @param {vscode.ExtensionContext} context - The VSCode extension context for managing disposables and state.
 */
export function activate(context: vscode.ExtensionContext) {
	// Extension is now active!

	// Register a sample command
	const disposable = vscode.commands.registerCommand(
		"extension.helloWorld",
		() => {
			vscode.window.showInformationMessage("Hello from VSCode Extension!");
		}
	);

	context.subscriptions.push(disposable);
}

/**
 * Deactivates the ElevenLabs Text-to-Speech extension.
 * Used for cleanup when the extension is unloaded.
 *
 * @returns {void}
 */
export function deactivate(): void {
	// No cleanup necessary at this time.
}
