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

import { HighlightManager } from "../src/highlightManager";

describe("HighlightManager", () => {
	it("should instantiate", () => {
		const manager = new HighlightManager();
		expect(manager).toBeInstanceOf(HighlightManager);
	});

	it("should have highlightRange and clearHighlights methods", () => {
		const manager = new HighlightManager();
		expect(typeof manager.highlightRange).toBe("function");
		expect(typeof manager.clearHighlights).toBe("function");
	});
});
