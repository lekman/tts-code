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

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as vscode from "vscode";

/**
 * Handles text highlighting and synchronization for the TTS extension.
 */
export class HighlightManager {
	/**
	 * Initializes a new instance of the HighlightManager.
	 */
	constructor() {
		// Initialize highlight manager
	}

	/**
	 * Clears all highlights in the provided text editor.
	 * @param {import('vscode').TextEditor} _editor - The VSCode text editor instance.
	 * @returns {void}
	 */
	public clearHighlights(_editor: import("vscode").TextEditor): void {
		// Placeholder for clearing highlights
	}

	/**
	 * Highlights a specific range in the provided text editor.
	 * @param {import('vscode').TextEditor} _editor - The VSCode text editor instance.
	 * @param {import('vscode').Range} _range - The range of text to highlight.
	 * @returns {void}
	 */
	public highlightRange(
		_editor: import("vscode").TextEditor,
		_range: import("vscode").Range
	): void {
		// Placeholder for highlighting a range in the editor
	}
}
