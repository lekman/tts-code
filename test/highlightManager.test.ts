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

import { HighlightManager, HighlightOptions } from "../src/highlightManager";

describe("HighlightManager", () => {
	let highlightManager: HighlightManager;
	let mockTextEditor: any;
	let mockDecorationType: any;
	let mockDocument: any;

	beforeEach(() => {
		// Mock the decoration type
		mockDecorationType = {
			dispose: jest.fn(),
		};
		(vscode.window.createTextEditorDecorationType as jest.Mock).mockReturnValue(
			mockDecorationType
		);

		// Mock document
		mockDocument = {
			getText: jest
				.fn()
				.mockReturnValue(
					"This is a test document with multiple words and sentences. It has some content."
				),
			positionAt: jest.fn((offset: number) => ({
				line: Math.floor(offset / 20),
				character: offset % 20,
			})),
			lineAt: jest.fn((line: number) => ({
				range: new vscode.Range(line, 0, line, 20),
			})),
		};

		// Mock text editor
		mockTextEditor = {
			setDecorations: jest.fn(),
			revealRange: jest.fn(),
			document: mockDocument,
		};

		// Mock Position constructor
		(vscode.Position as any) = jest.fn((line, char) => ({
			line,
			character: char,
		}));

		highlightManager = new HighlightManager();
	});

	describe("constructor", () => {
		it("should instantiate with default options", () => {
			expect(highlightManager).toBeInstanceOf(HighlightManager);
			expect(vscode.window.createTextEditorDecorationType).toHaveBeenCalledWith(
				{
					backgroundColor: "rgba(255, 255, 0, 0.3)",
					borderColor: undefined,
					borderWidth: undefined,
					borderStyle: undefined,
					fontWeight: undefined,
					textDecoration: undefined,
					isWholeLine: false,
				}
			);
		});

		it("should instantiate with custom options", () => {
			const customOptions: HighlightOptions = {
				backgroundColor: "rgba(0, 255, 0, 0.5)",
				borderColor: "red",
				borderWidth: "2px",
				borderStyle: "solid",
				fontWeight: "bold",
				textDecoration: "underline",
			};

			new HighlightManager(customOptions);
			expect(vscode.window.createTextEditorDecorationType).toHaveBeenCalledWith(
				{
					backgroundColor: customOptions.backgroundColor,
					borderColor: customOptions.borderColor,
					borderWidth: customOptions.borderWidth,
					borderStyle: customOptions.borderStyle,
					fontWeight: customOptions.fontWeight,
					textDecoration: customOptions.textDecoration,
					isWholeLine: false,
				}
			);
		});
	});

	describe("setActiveEditor", () => {
		it("should set the active editor and calculate word positions", () => {
			highlightManager.setActiveEditor(mockTextEditor);
			// Verify by checking that clearHighlights works with the editor
			highlightManager.clearHighlights();
			expect(mockTextEditor.setDecorations).toHaveBeenCalledWith(
				mockDecorationType,
				[]
			);
		});

		it("should clear existing highlights when changing editors", () => {
			highlightManager.setActiveEditor(mockTextEditor);
			const range = new vscode.Range(0, 0, 1, 10);
			highlightManager.highlightRange(range);

			// Change editor
			const newEditor = { ...mockTextEditor };
			highlightManager.setActiveEditor(newEditor);

			// Should have cleared decorations on the first editor
			expect(mockTextEditor.setDecorations).toHaveBeenCalledWith(
				mockDecorationType,
				[]
			);
		});
	});

	describe("highlightRange", () => {
		it("should highlight a range when editor is set", () => {
			const range = new vscode.Range(0, 0, 1, 10);
			highlightManager.setActiveEditor(mockTextEditor);
			highlightManager.highlightRange(range);

			expect(mockTextEditor.setDecorations).toHaveBeenCalledWith(
				mockDecorationType,
				[{ range }]
			);

			expect(mockTextEditor.revealRange).toHaveBeenCalledWith(
				range,
				vscode.TextEditorRevealType.InCenterIfOutsideViewport
			);
		});

		it("should not throw when no editor is set", () => {
			const range = new vscode.Range(0, 0, 1, 10);
			expect(() => highlightManager.highlightRange(range)).not.toThrow();
		});
	});

	describe("clearHighlights", () => {
		it("should clear highlights and reset state", () => {
			highlightManager.setActiveEditor(mockTextEditor);
			highlightManager.clearHighlights();

			expect(mockTextEditor.setDecorations).toHaveBeenCalledWith(
				mockDecorationType,
				[]
			);
		});

		it("should not throw when no editor is set", () => {
			expect(() => highlightManager.clearHighlights()).not.toThrow();
		});
	});

	describe("setHighlightMode", () => {
		it("should set highlight mode to word", () => {
			highlightManager.setHighlightMode("word");
			// Mode is internal, test indirectly through highlighting behavior
			expect(() => highlightManager.setHighlightMode("word")).not.toThrow();
		});

		it("should set highlight mode to sentence", () => {
			highlightManager.setHighlightMode("sentence");
			expect(() => highlightManager.setHighlightMode("sentence")).not.toThrow();
		});

		it("should set highlight mode to line", () => {
			highlightManager.setHighlightMode("line");
			expect(() => highlightManager.setHighlightMode("line")).not.toThrow();
		});
	});

	describe("calculatePositionFromTimestamp", () => {
		beforeEach(() => {
			highlightManager.setActiveEditor(mockTextEditor);
		});

		it("should return undefined when no editor is set", () => {
			const manager = new HighlightManager();
			const result = manager.calculatePositionFromTimestamp(5, 10);
			expect(result).toBeUndefined();
		});

		it("should return undefined when total duration is zero", () => {
			const result = highlightManager.calculatePositionFromTimestamp(5, 0);
			expect(result).toBeUndefined();
		});

		it("should calculate position based on progress", () => {
			const result = highlightManager.calculatePositionFromTimestamp(5, 10);
			expect(result).toBeDefined();
			// At 50% progress, should highlight a word around the middle
		});

		it("should not re-highlight the same word", () => {
			// First call
			const result1 = highlightManager.calculatePositionFromTimestamp(5, 10);
			expect(result1).toBeDefined();

			// Second call with similar timestamp
			const result2 = highlightManager.calculatePositionFromTimestamp(5.1, 10);
			expect(result2).toBeUndefined();
		});

		it("should handle edge cases", () => {
			// At the beginning
			const result1 = highlightManager.calculatePositionFromTimestamp(0, 10);
			expect(result1).toBeDefined();

			// At the end
			const result2 = highlightManager.calculatePositionFromTimestamp(10, 10);
			expect(result2).toBeDefined();
		});
	});

	describe("highlightAtTimestamp", () => {
		it("should highlight at the calculated position", () => {
			highlightManager.setActiveEditor(mockTextEditor);
			highlightManager.highlightAtTimestamp(5, 10);

			expect(mockTextEditor.setDecorations).toHaveBeenCalled();
		});

		it("should not highlight when position cannot be calculated", () => {
			highlightManager.highlightAtTimestamp(5, 10);
			expect(mockTextEditor.setDecorations).not.toHaveBeenCalled();
		});
	});

	describe("getHighlightedText", () => {
		it("should return highlighted text when available", () => {
			highlightManager.setActiveEditor(mockTextEditor);
			const range = new vscode.Range(0, 0, 0, 4);
			highlightManager.highlightRange(range);

			mockDocument.getText.mockReturnValue("This");
			const text = highlightManager.getHighlightedText();
			expect(text).toBe("This");
		});

		it("should return undefined when no highlights", () => {
			highlightManager.setActiveEditor(mockTextEditor);
			const text = highlightManager.getHighlightedText();
			expect(text).toBeUndefined();
		});

		it("should return undefined when no editor", () => {
			const text = highlightManager.getHighlightedText();
			expect(text).toBeUndefined();
		});
	});

	describe("navigation methods", () => {
		beforeEach(() => {
			highlightManager.setActiveEditor(mockTextEditor);
		});

		describe("highlightNextWord", () => {
			it("should highlight the next word", () => {
				const result = highlightManager.highlightNextWord();
				expect(result).toBe(true);
				expect(mockTextEditor.setDecorations).toHaveBeenCalled();
			});

			it("should return false at the end", () => {
				// Highlight all words first
				let result = true;
				while (result) {
					result = highlightManager.highlightNextWord();
				}
				expect(result).toBe(false);
			});
		});

		describe("highlightPreviousWord", () => {
			it("should highlight the previous word", () => {
				// First move forward
				highlightManager.highlightNextWord();
				highlightManager.highlightNextWord();

				// Then move back
				const result = highlightManager.highlightPreviousWord();
				expect(result).toBe(true);
				expect(mockTextEditor.setDecorations).toHaveBeenCalled();
			});

			it("should return false at the beginning", () => {
				const result = highlightManager.highlightPreviousWord();
				expect(result).toBe(false);
			});
		});
	});

	describe("getWordCount", () => {
		it("should return the number of words", () => {
			highlightManager.setActiveEditor(mockTextEditor);
			const count = highlightManager.getWordCount();
			expect(count).toBeGreaterThan(0);
		});

		it("should return 0 when no editor", () => {
			const count = highlightManager.getWordCount();
			expect(count).toBe(0);
		});
	});

	describe("getProgress", () => {
		it("should return progress as percentage", () => {
			highlightManager.setActiveEditor(mockTextEditor);

			// Highlight first word
			highlightManager.highlightNextWord();
			const progress = highlightManager.getProgress();
			expect(progress).toBeGreaterThanOrEqual(0);
			expect(progress).toBeLessThanOrEqual(1);
		});

		it("should return -1 when no words highlighted", () => {
			highlightManager.setActiveEditor(mockTextEditor);
			const progress = highlightManager.getProgress();
			expect(progress).toBe(-1);
		});

		it("should return -1 when no words available", () => {
			const progress = highlightManager.getProgress();
			expect(progress).toBe(-1);
		});
	});

	describe("highlight modes", () => {
		beforeEach(() => {
			highlightManager.setActiveEditor(mockTextEditor);

			// Mock a more complex document for sentence testing
			mockDocument.getText.mockReturnValue(
				"This is first. This is second sentence. And this is third!"
			);
		});

		it("should highlight by word in word mode", () => {
			highlightManager.setHighlightMode("word");
			highlightManager.highlightNextWord();

			expect(mockTextEditor.setDecorations).toHaveBeenCalled();
			const call = mockTextEditor.setDecorations.mock.calls[0];
			const decorations = call[1];
			expect(decorations).toHaveLength(1);
		});

		it("should highlight by sentence in sentence mode", () => {
			highlightManager.setHighlightMode("sentence");
			highlightManager.highlightNextWord();

			expect(mockTextEditor.setDecorations).toHaveBeenCalled();
		});

		it("should highlight by line in line mode", () => {
			highlightManager.setHighlightMode("line");
			highlightManager.highlightNextWord();

			expect(mockTextEditor.setDecorations).toHaveBeenCalled();
			expect(mockDocument.lineAt).toHaveBeenCalled();
		});
	});

	describe("dispose", () => {
		it("should dispose decoration type and clear highlights", () => {
			highlightManager.setActiveEditor(mockTextEditor);
			highlightManager.dispose();

			expect(mockDecorationType.dispose).toHaveBeenCalled();
			expect(mockTextEditor.setDecorations).toHaveBeenCalledWith(
				mockDecorationType,
				[]
			);
		});

		it("should clear editor reference", () => {
			highlightManager.setActiveEditor(mockTextEditor);
			highlightManager.dispose();

			// After dispose, operations should not throw
			expect(() => highlightManager.clearHighlights()).not.toThrow();
			expect(() => highlightManager.highlightNextWord()).not.toThrow();
		});
	});

	describe("edge cases", () => {
		it("should handle empty document", () => {
			mockDocument.getText.mockReturnValue("");
			highlightManager.setActiveEditor(mockTextEditor);

			expect(highlightManager.getWordCount()).toBe(0);
			expect(highlightManager.highlightNextWord()).toBe(false);
		});

		it("should handle document with only whitespace", () => {
			mockDocument.getText.mockReturnValue("   \n\t  \n   ");
			highlightManager.setActiveEditor(mockTextEditor);

			expect(highlightManager.getWordCount()).toBe(0);
		});

		it("should handle special characters in text", () => {
			mockDocument.getText.mockReturnValue("Hello, world! How are you?");
			highlightManager.setActiveEditor(mockTextEditor);

			const count = highlightManager.getWordCount();
			expect(count).toBe(5); // Words with punctuation count as single words
		});
	});
});
