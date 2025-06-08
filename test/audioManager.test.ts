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
	let audioManager: AudioManager;

	beforeEach(() => {
		audioManager = new AudioManager();
	});

	it("should instantiate", () => {
		expect(audioManager).toBeInstanceOf(AudioManager);
	});

	it("should have playAudio, pauseAudio, and stopAudio methods", () => {
		expect(typeof audioManager.playAudio).toBe("function");
		expect(typeof audioManager.pauseAudio).toBe("function");
		expect(typeof audioManager.stopAudio).toBe("function");
	});

	it("should have dispose method", () => {
		expect(typeof audioManager.dispose).toBe("function");
	});

	it("should call stopAudio when disposed", () => {
		const stopAudioSpy = jest.spyOn(audioManager, "stopAudio");
		audioManager.dispose();
		expect(stopAudioSpy).toHaveBeenCalled();
	});
});
