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
 * Configuration options for text highlighting
 */
export interface HighlightOptions {
	backgroundColor?: string;
	borderColor?: string;
	borderWidth?: string;
	borderStyle?: string;
	fontWeight?: string;
	textDecoration?: string;
}

/**
 * Represents a word with its position in the text
 */
interface WordPosition {
	word: string;
	startIndex: number;
	endIndex: number;
	startPosition: vscode.Position;
	endPosition: vscode.Position;
}

/**
 * Handles text highlighting and synchronization for the TTS extension.
 */
export class HighlightManager {
	private currentDecorations: vscode.DecorationOptions[] = [];
	private currentEditor?: vscode.TextEditor;
	private decorationType: vscode.TextEditorDecorationType;
	private highlightMode: "word" | "sentence" | "line" = "word";
	private lastHighlightedIndex: number = -1;
	private wordPositions: WordPosition[] = [];

	/**
	 * Initializes a new instance of the HighlightManager.
	 * @param {HighlightOptions} options - Optional highlighting configuration
	 */
	constructor(options?: HighlightOptions) {
		// Initialize highlight manager with configurable decoration
		const defaultOptions: vscode.DecorationRenderOptions = {
			backgroundColor: options?.backgroundColor || "rgba(255, 255, 0, 0.3)",
			borderColor: options?.borderColor,
			borderWidth: options?.borderWidth,
			borderStyle: options?.borderStyle,
			fontWeight: options?.fontWeight,
			textDecoration: options?.textDecoration,
			isWholeLine: false,
		};

		this.decorationType =
			vscode.window.createTextEditorDecorationType(defaultOptions);
	}

	/**
	 * Calculates the position in text based on audio timestamp.
	 * @param {number} timestamp - The current audio timestamp in seconds.
	 * @param {number} totalDuration - The total audio duration in seconds.
	 * @returns {vscode.Range | undefined} The range to highlight, or undefined if not found.
	 */
	public calculatePositionFromTimestamp(
		timestamp: number,
		totalDuration: number
	): vscode.Range | undefined {
		if (
			!this.currentEditor ||
			totalDuration <= 0 ||
			this.wordPositions.length === 0
		) {
			return undefined;
		}

		// Calculate progress as a percentage
		const progress = Math.max(0, Math.min(1, timestamp / totalDuration));

		// Determine which word to highlight based on progress
		const targetIndex = Math.floor(progress * this.wordPositions.length);
		const wordIndex = Math.min(targetIndex, this.wordPositions.length - 1);

		// Don't re-highlight the same word
		if (wordIndex === this.lastHighlightedIndex) {
			return undefined;
		}

		this.lastHighlightedIndex = wordIndex;

		// Get the range based on highlight mode
		return this.getRangeForMode(wordIndex);
	}

	/**
	 * Clears all highlights in the current text editor.
	 * @returns {void}
	 */
	public clearHighlights(): void {
		if (this.currentEditor) {
			this.currentEditor.setDecorations(this.decorationType, []);
			this.currentDecorations = [];
			this.lastHighlightedIndex = -1;
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
		// Clear editor reference
		this.currentEditor = undefined;
	}

	/**
	 * Gets the current highlighted text.
	 * @returns {string | undefined} The currently highlighted text.
	 */
	public getHighlightedText(): string | undefined {
		if (!this.currentEditor || this.currentDecorations.length === 0) {
			return undefined;
		}

		const range = this.currentDecorations[0].range;
		return this.currentEditor.document.getText(range);
	}

	/**
	 * Gets the current highlight progress as a percentage.
	 * @returns {number} Progress from 0 to 1, or -1 if no words.
	 */
	public getProgress(): number {
		if (this.wordPositions.length === 0 || this.lastHighlightedIndex < 0) {
			return -1;
		}
		return this.lastHighlightedIndex / (this.wordPositions.length - 1);
	}

	/**
	 * Gets the total number of words in the current document.
	 * @returns {number} The total number of words.
	 */
	public getWordCount(): number {
		return this.wordPositions.length;
	}

	/**
	 * Highlights text at a specific position based on timestamp.
	 * @param {number} timestamp - The current audio timestamp in seconds.
	 * @param {number} totalDuration - The total audio duration in seconds.
	 * @returns {void}
	 */
	public highlightAtTimestamp(timestamp: number, totalDuration: number): void {
		const range = this.calculatePositionFromTimestamp(timestamp, totalDuration);
		if (range) {
			this.highlightRange(range);
		}
	}

	/**
	 * Highlights the next word in sequence.
	 * @returns {boolean} True if a word was highlighted, false if at the end.
	 */
	public highlightNextWord(): boolean {
		if (this.wordPositions.length === 0) {
			this.calculateWordPositions();
		}

		const nextIndex = this.lastHighlightedIndex + 1;
		if (nextIndex >= this.wordPositions.length) {
			return false;
		}

		this.lastHighlightedIndex = nextIndex;
		const range = this.getRangeForMode(nextIndex);
		this.highlightRange(range);
		return true;
	}

	/**
	 * Highlights the previous word in sequence.
	 * @returns {boolean} True if a word was highlighted, false if at the beginning.
	 */
	public highlightPreviousWord(): boolean {
		const prevIndex = this.lastHighlightedIndex - 1;
		if (prevIndex < 0) {
			return false;
		}

		this.lastHighlightedIndex = prevIndex;
		const range = this.getRangeForMode(prevIndex);
		this.highlightRange(range);
		return true;
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
		// Clear any existing highlights when changing editors
		this.clearHighlights();
		this.currentEditor = editor;
		// Recalculate word positions for the new editor
		this.calculateWordPositions();
	}

	/**
	 * Sets the highlighting mode (word, sentence, or line).
	 * @param {string} mode - The highlighting mode to use.
	 * @returns {void}
	 */
	public setHighlightMode(mode: "word" | "sentence" | "line"): void {
		this.highlightMode = mode;
	}

	/**
	 * Calculates word positions for the current editor's text.
	 * @returns {void}
	 */
	private calculateWordPositions(): void {
		if (!this.currentEditor) {
			return;
		}

		this.wordPositions = [];
		const document = this.currentEditor.document;
		const text = document.getText();

		// Regular expression to match words (including punctuation attached to words)
		const wordRegex = /\S+/g;
		let match;

		while ((match = wordRegex.exec(text)) !== null) {
			const startIndex = match.index;
			const endIndex = startIndex + match[0].length;

			this.wordPositions.push({
				word: match[0],
				startIndex,
				endIndex,
				startPosition: document.positionAt(startIndex),
				endPosition: document.positionAt(endIndex),
			});
		}
	}

	/**
	 * Gets the range for the line containing the given word.
	 * @param {WordPosition} word - The word position.
	 * @returns {vscode.Range} The line range.
	 */
	private getLineRange(word: WordPosition): vscode.Range {
		if (!this.currentEditor) {
			return new vscode.Range(word.startPosition, word.endPosition);
		}

		const line = word.startPosition.line;
		return this.currentEditor.document.lineAt(line).range;
	}

	/**
	 * Gets the range for highlighting based on the current mode.
	 * @param {number} wordIndex - The index of the current word.
	 * @returns {vscode.Range} The range to highlight.
	 */
	private getRangeForMode(wordIndex: number): vscode.Range {
		const word = this.wordPositions[wordIndex];

		switch (this.highlightMode) {
			case "sentence":
				return this.getSentenceRange(wordIndex);
			case "line":
				return this.getLineRange(word);
			case "word":
			default:
				return new vscode.Range(word.startPosition, word.endPosition);
		}
	}

	/**
	 * Gets the range for the sentence containing the word at the given index.
	 * @param {number} wordIndex - The index of the current word.
	 * @returns {vscode.Range} The sentence range.
	 */
	private getSentenceRange(wordIndex: number): vscode.Range {
		if (!this.currentEditor) {
			const word = this.wordPositions[wordIndex];
			return new vscode.Range(word.startPosition, word.endPosition);
		}

		const document = this.currentEditor.document;
		const text = document.getText();
		const currentWord = this.wordPositions[wordIndex];

		// Find sentence boundaries
		const sentenceEndRegex = /[.!?]/g;
		let sentenceStart = 0;
		let sentenceEnd = text.length;

		// Find the start of the sentence
		for (let i = currentWord.startIndex - 1; i >= 0; i--) {
			if (sentenceEndRegex.test(text[i])) {
				sentenceStart = i + 1;
				// Skip whitespace
				while (sentenceStart < text.length && /\s/.test(text[sentenceStart])) {
					sentenceStart++;
				}
				break;
			}
		}

		// Find the end of the sentence
		sentenceEndRegex.lastIndex = currentWord.endIndex;
		const match = sentenceEndRegex.exec(text);
		if (match) {
			sentenceEnd = match.index + 1;
		}

		return new vscode.Range(
			document.positionAt(sentenceStart),
			document.positionAt(sentenceEnd)
		);
	}
}
