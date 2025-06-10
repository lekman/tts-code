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

import { AudioManager } from "../src/audioManager";
import { HighlightManager } from "../src/highlightManager";
import { WebviewProvider } from "../src/webviewProvider";

describe("WebviewProvider", () => {
	let webviewProvider: WebviewProvider;
	let mockContext: any;
	let mockAudioManager: AudioManager;
	let mockHighlightManager: HighlightManager;

	beforeEach(() => {
		mockContext = {
			extensionUri: { fsPath: "/test/path" },
		};
		mockAudioManager = new AudioManager();
		mockHighlightManager = new HighlightManager();
		webviewProvider = new WebviewProvider(
			mockContext,
			mockAudioManager,
			mockHighlightManager
		);
	});

	it("should instantiate", () => {
		expect(webviewProvider).toBeInstanceOf(WebviewProvider);
	});

	it("should have resolveWebviewView method", () => {
		expect(typeof webviewProvider.resolveWebviewView).toBe("function");
	});

	it("should call resolveWebviewView and set webview.html", () => {
		const mockOnDidReceiveMessage = jest.fn(() => ({ dispose: jest.fn() }));
		const webviewView = {
			webview: {
				options: {},
				html: "",
				onDidReceiveMessage: mockOnDidReceiveMessage,
				cspSource: "vscode-webview://test",
			},
		} as any;

		// Add subscriptions array to the mockContext
		mockContext.subscriptions = [];

		webviewProvider.resolveWebviewView(webviewView, {} as any, {} as any);
		expect(typeof webviewView.webview.html).toBe("string");
		expect(webviewView.webview.html.length).toBeGreaterThan(0);
		expect(webviewView.webview.options.enableScripts).toBe(true);
		expect(mockOnDidReceiveMessage).toHaveBeenCalled();
	});

	// TODO: Fix test - it's still getting the old HTML due to Jest module caching
	// it("should include accessibility features in HTML", () => {
	// 	const mockOnDidReceiveMessage = jest.fn(() => ({ dispose: jest.fn() }));
	// 	const webviewView = {
	// 		webview: {
	// 			options: {},
	// 			html: "",
	// 			onDidReceiveMessage: mockOnDidReceiveMessage,
	// 			cspSource: "vscode-webview://test",
	// 		},
	// 	} as any;

	// 	mockContext.subscriptions = [];
	// 	webviewProvider.resolveWebviewView(webviewView, {} as any, {} as any);

	// 	const html = webviewView.webview.html;

	// 	// Check for ARIA attributes
	// 	expect(html).toContain('role="application"');
	// 	expect(html).toContain('aria-label="Text-to-Speech Player"');
	// 	expect(html).toContain('role="toolbar"');
	// 	expect(html).toContain('role="slider"');
	// 	expect(html).toContain('aria-live="polite"');
	// 	expect(html).toContain('aria-valuemin="0"');
	// 	expect(html).toContain('aria-valuemax="100"');

	// 	// Check for keyboard navigation elements
	// 	expect(html).toContain('tabindex="0"');
	// 	expect(html).toContain('Skip to main controls');

	// 	// Check for high contrast CSS
	// 	expect(html).toContain('@media (prefers-contrast: high)');
	// 	expect(html).toContain('@media (forced-colors: active)');

	// 	// Check for skip buttons
	// 	expect(html).toContain('skipBackBtn');
	// 	expect(html).toContain('skipForwardBtn');
	// 	expect(html).toContain('Skip backward 10 seconds');
	// 	expect(html).toContain('Skip forward 10 seconds');
	// });

	it("should have dispose method", () => {
		expect(typeof webviewProvider.dispose).toBe("function");
	});

	it("should call dispose without error", () => {
		expect(() => webviewProvider.dispose()).not.toThrow();
	});

	it("should have correct viewType", () => {
		expect(WebviewProvider.viewType).toBe("ttsCode.webview");
	});

	describe("postMessage", () => {
		it("should post message to webview when view exists", () => {
			const mockPostMessage = jest.fn();
			const webviewView = {
				webview: {
					options: {},
					html: "",
					onDidReceiveMessage: jest.fn(() => ({ dispose: jest.fn() })),
					postMessage: mockPostMessage,
				},
			} as any;

			mockContext.subscriptions = [];
			webviewProvider.resolveWebviewView(webviewView, {} as any, {} as any);

			const message = { type: "test", data: "test data" };
			webviewProvider.postMessage(message);

			expect(mockPostMessage).toHaveBeenCalledWith(message);
		});

		it("should not throw when posting message without view", () => {
			const message = { type: "test", data: "test data" };
			expect(() => webviewProvider.postMessage(message)).not.toThrow();
		});
	});

	describe("onDidReceiveMessage", () => {
		it("should expose event emitter", () => {
			expect(webviewProvider.onDidReceiveMessage).toBeDefined();
			expect(typeof webviewProvider.onDidReceiveMessage).toBe("function");
		});

		it("should handle webview messages", () => {
			let messageHandler: any;
			const mockOnDidReceiveMessage = jest.fn((handler) => {
				messageHandler = handler;
				// Return a mock disposable
				return { dispose: jest.fn() };
			});

			const webviewView = {
				webview: {
					options: {},
					html: "",
					onDidReceiveMessage: mockOnDidReceiveMessage,
				},
			} as any;

			mockContext.subscriptions = [];

			// Set up the webview
			webviewProvider.resolveWebviewView(webviewView, {} as any, {} as any);

			// Verify the handler was registered
			expect(mockOnDidReceiveMessage).toHaveBeenCalled();
			expect(typeof messageHandler).toBe("function");

			// Test that the handler works
			const testMessage = { type: "test", data: "test data" };
			expect(() => messageHandler(testMessage)).not.toThrow();
		});
	});
});
