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

import * as extension from "../src/extension";

describe("extension", () => {
	it("should export an activate function", () => {
		expect(typeof extension.activate).toBe("function");
	});

	it("should export a deactivate function", () => {
		expect(typeof extension.deactivate).toBe("function");
	});

	it("should call activate without error and register the command", () => {
		const context = { subscriptions: [] };
		expect(() => extension.activate(context as any)).not.toThrow();
		// Should push at least one subscription
		expect(context.subscriptions.length).toBeGreaterThan(0);
	});

	it("should call deactivate without error", () => {
		expect(() => extension.deactivate()).not.toThrow();
	});
});
