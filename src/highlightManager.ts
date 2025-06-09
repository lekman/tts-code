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
 * Handles text highlighting and synchronization for the TTS extension.
 */
export class HighlightManager {
	private currentDecorations: vscode.DecorationOptions[] = [];
	private currentEditor?: vscode.TextEditor;
	private decorationType: vscode.TextEditorDecorationType;

	/**
	 * Initializes a new instance of the HighlightManager.
	 */
	constructor() {
		// Initialize highlight manager with yellow background decoration
		this.decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: "rgba(255, 255, 0, 0.3)",
			isWholeLine: false,
		});
	}

	/**
	 * Clears all highlights in the current text editor.
	 * @returns {void}
	 */
	public clearHighlights(): void {
		if (this.currentEditor) {
			this.currentEditor.setDecorations(this.decorationType, []);
			this.currentDecorations = [];
		}
	}

	/**
	 * Disposes of the highlight manager and cleans up resources.
	 * @returns {void}
	 */
	public dispose(): void {
		// Clear any active highlights
		this.clearHighlights();
		// Dispose of decoration types
		this.decorationType.dispose();
	}

	/**
	 * Highlights a specific range in the current text editor.
	 * @param {vscode.Range} range - The range of text to highlight.
	 * @returns {void}
	 */
	public highlightRange(range: vscode.Range): void {
		if (!this.currentEditor) {
			return;
		}

		this.currentDecorations = [{ range }];
		this.currentEditor.setDecorations(
			this.decorationType,
			this.currentDecorations
		);

		// Ensure the highlighted text is visible
		this.currentEditor.revealRange(
			range,
			vscode.TextEditorRevealType.InCenterIfOutsideViewport
		);
	}

	/**
	 * Sets the active text editor for highlighting.
	 * @param {vscode.TextEditor} editor - The VSCode text editor instance.
	 * @returns {void}
	 */
	public setActiveEditor(editor: vscode.TextEditor): void {
		this.currentEditor = editor;
	}
}
