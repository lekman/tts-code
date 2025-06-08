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

import { WebviewProvider } from "../src/webviewProvider";

describe("WebviewProvider", () => {
	let webviewProvider: WebviewProvider;
	let mockContext: any;

	beforeEach(() => {
		mockContext = {
			extensionUri: { fsPath: "/test/path" },
		};
		webviewProvider = new WebviewProvider(mockContext);
	});

	it("should instantiate", () => {
		expect(webviewProvider).toBeInstanceOf(WebviewProvider);
	});

	it("should have resolveWebviewView method", () => {
		expect(typeof webviewProvider.resolveWebviewView).toBe("function");
	});

	it("should call resolveWebviewView and set webview.html", () => {
		const webviewView = {
			webview: {
				options: {},
				html: "",
			},
		} as any;
		webviewProvider.resolveWebviewView(webviewView, {} as any, {} as any);
		expect(typeof webviewView.webview.html).toBe("string");
		expect(webviewView.webview.html.length).toBeGreaterThan(0);
		expect(webviewView.webview.options.enableScripts).toBe(true);
	});

	it("should have dispose method", () => {
		expect(typeof webviewProvider.dispose).toBe("function");
	});

	it("should call dispose without error", () => {
		expect(() => webviewProvider.dispose()).not.toThrow();
	});

	it("should have correct viewType", () => {
		expect(WebviewProvider.viewType).toBe("ttsCode.webview");
	});
});
