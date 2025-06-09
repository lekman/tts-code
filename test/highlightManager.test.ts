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

import { HighlightManager } from "../src/highlightManager";

describe("HighlightManager", () => {
	let highlightManager: HighlightManager;
	let mockTextEditor: any;
	let mockDecorationType: any;

	beforeEach(() => {
		// Mock the decoration type
		mockDecorationType = {
			dispose: jest.fn(),
		};
		(vscode.window.createTextEditorDecorationType as jest.Mock).mockReturnValue(
			mockDecorationType
		);

		// Mock text editor
		mockTextEditor = {
			setDecorations: jest.fn(),
			revealRange: jest.fn(),
			document: {
				lineAt: jest.fn().mockReturnValue({
					range: new vscode.Range(0, 0, 0, 10),
				}),
			},
		};

		highlightManager = new HighlightManager();
	});

	it("should instantiate", () => {
		expect(highlightManager).toBeInstanceOf(HighlightManager);
	});

	it("should create decoration type on instantiation", () => {
		expect(vscode.window.createTextEditorDecorationType).toHaveBeenCalledWith({
			backgroundColor: "rgba(255, 255, 0, 0.3)",
			isWholeLine: false,
		});
	});

	it("should have setActiveEditor method", () => {
		expect(typeof highlightManager.setActiveEditor).toBe("function");
	});

	it("should have highlightRange and clearHighlights methods", () => {
		expect(typeof highlightManager.highlightRange).toBe("function");
		expect(typeof highlightManager.clearHighlights).toBe("function");
	});

	describe("setActiveEditor", () => {
		it("should set the active editor", () => {
			highlightManager.setActiveEditor(mockTextEditor);
			// Test by calling a method that uses the editor
			highlightManager.clearHighlights();
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

			// Also check that it reveals the range
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
		it("should clear highlights when editor is set", () => {
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

	describe("dispose", () => {
		it("should dispose decoration type", () => {
			highlightManager.dispose();
			expect(mockDecorationType.dispose).toHaveBeenCalled();
		});

		it("should clear editor reference", () => {
			highlightManager.setActiveEditor(mockTextEditor);
			highlightManager.dispose();
			// After dispose, operations should not throw
			expect(() => highlightManager.clearHighlights()).not.toThrow();
		});
	});
});
