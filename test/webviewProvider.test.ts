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
	it("should instantiate", () => {
		// Mock the context as an empty object for now
		const provider = new WebviewProvider({} as any);
		expect(provider).toBeInstanceOf(WebviewProvider);
	});

	it("should have resolveWebviewView method", () => {
		const provider = new WebviewProvider({} as any);
		expect(typeof provider.resolveWebviewView).toBe("function");
	});

	it("should call resolveWebviewView and set webview.html", () => {
		const provider = new WebviewProvider({} as any);
		const webviewView = {
			webview: {
				options: {},
				html: "",
			},
		} as any;
		provider.resolveWebviewView(webviewView, {} as any, {} as any);
		expect(typeof webviewView.webview.html).toBe("string");
		expect(webviewView.webview.html.length).toBeGreaterThan(0);
	});
});
