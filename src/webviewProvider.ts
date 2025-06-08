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
 * Provides a webview panel for playback controls and TTS UI in the extension.
 */
export class WebviewProvider implements vscode.WebviewViewProvider {
	/**
	 * The unique view type identifier for the webview.
	 */
	public static readonly viewType = "ttsCode.webview";

	/**
	 * Creates a new WebviewProvider instance.
	 * @param {import('vscode').ExtensionContext} _context - The VSCode extension context for resource management.
	 */
	constructor(private readonly _context: vscode.ExtensionContext) {}

	/**
	 * Resolves and displays the webview view with playback controls UI.
	 * @param {import('vscode').WebviewView} webviewView - The webview view instance to populate.
	 * @param {import('vscode').WebviewViewResolveContext} _context - The resolve context for the webview view.
	 * @param {import('vscode').CancellationToken} _token - Cancellation token for the resolve operation.
	 * @returns {void}
	 */
	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	): void {
		webviewView.webview.options = {
			enableScripts: true,
		};
		webviewView.webview.html = this.getHtmlForWebview();
	}

	/**
	 * Returns the HTML content for the playback controls webview.
	 * @returns {string} The HTML string for the webview UI.
	 */
	private getHtmlForWebview(): string {
		// Placeholder HTML for playback controls
		return `
			<html>
				<body>
					<h2>Playback Controls</h2>
					<button>Play</button>
					<button>Pause</button>
				</body>
			</html>
		`;
	}
}
