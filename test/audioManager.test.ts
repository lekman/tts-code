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

describe("AudioManager", () => {
	it("should instantiate", () => {
		const manager = new AudioManager();
		expect(manager).toBeInstanceOf(AudioManager);
	});

	it("should have playAudio, pauseAudio, and stopAudio methods", () => {
		const manager = new AudioManager();
		expect(typeof manager.playAudio).toBe("function");
		expect(typeof manager.pauseAudio).toBe("function");
		expect(typeof manager.stopAudio).toBe("function");
	});
});
