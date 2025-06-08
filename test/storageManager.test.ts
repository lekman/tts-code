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

import { StorageManager } from "../src/storageManager";

describe("StorageManager", () => {
	it("should instantiate", () => {
		// Mock the context as an empty object for now
		const manager = new StorageManager({} as any);
		expect(manager).toBeInstanceOf(StorageManager);
	});

	it("should have saveAudioFile, getAudioCache, and setAudioCache methods", () => {
		const manager = new StorageManager({} as any);
		expect(typeof manager.saveAudioFile).toBe("function");
		expect(typeof manager.getAudioCache).toBe("function");
		expect(typeof manager.setAudioCache).toBe("function");
	});

	it("should call saveAudioFile, getAudioCache, and setAudioCache without error", async () => {
		const manager = new StorageManager({} as any);
		await expect(
			manager.saveAudioFile(new Uint8Array(), "test.mp3")
		).resolves.toBeUndefined();
		await expect(manager.getAudioCache("key")).resolves.toBeUndefined();
		await expect(
			manager.setAudioCache("key", new Uint8Array())
		).resolves.toBeUndefined();
	});
});
