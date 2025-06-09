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

import { StorageManager } from "../src/storageManager";

describe("StorageManager", () => {
	let manager: StorageManager;
	let mockContext: any;
	let mockFileSystem: any;
	let mockWorkspaceConfig: any;

	beforeEach(() => {
		// Clear all mocks
		jest.clearAllMocks();

		// Mock file system operations
		mockFileSystem = {
			readFile: jest.fn(),
			writeFile: jest.fn(),
			delete: jest.fn(),
			createDirectory: jest.fn(),
		};
		(vscode.workspace as any).fs = mockFileSystem;

		// Mock workspace configuration
		mockWorkspaceConfig = {
			get: jest.fn(),
		};
		(vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(
			mockWorkspaceConfig
		);

		// Mock context
		mockContext = {
			globalStorageUri: vscode.Uri.file("/mock/storage"),
		};

		// Mock vscode.Uri methods
		(vscode.Uri.joinPath as jest.Mock).mockImplementation((base, ...paths) => {
			const fullPath = [base.fsPath, ...paths].join("/");
			return vscode.Uri.file(fullPath);
		});

		(vscode.Uri.file as jest.Mock).mockImplementation((path) => ({
			fsPath: path,
			toString: () => path,
		}));

		(vscode.Uri.parse as jest.Mock).mockImplementation((str) => ({
			fsPath: str,
			toString: () => str,
		}));

		manager = new StorageManager(mockContext);
	});

	describe("constructor", () => {
		it("should instantiate and initialize cache", () => {
			expect(manager).toBeInstanceOf(StorageManager);
			expect(mockFileSystem.readFile).toHaveBeenCalled();
		});
	});

	describe("saveAudioFile", () => {
		it("should save audio file to default location", async () => {
			const audioData = Buffer.from("test audio data");
			const fileName = "test-file";

			mockWorkspaceConfig.get.mockReturnValue(undefined);
			mockFileSystem.writeFile.mockResolvedValue(undefined);

			const result = await manager.saveAudioFile(audioData, fileName);

			expect(mockFileSystem.createDirectory).toHaveBeenCalled();
			expect(mockFileSystem.writeFile).toHaveBeenCalled();
			expect(vscode.window.showInformationMessage).toHaveBeenCalled();
			expect(result).toBeDefined();
		});

		it("should save audio file to custom location", async () => {
			const audioData = Buffer.from("test audio data");
			const fileName = "test-file";
			const customPath = "/custom/path";

			mockWorkspaceConfig.get.mockReturnValue(customPath);
			mockFileSystem.writeFile.mockResolvedValue(undefined);

			await manager.saveAudioFile(audioData, fileName);

			expect(mockFileSystem.createDirectory).toHaveBeenCalled();
			expect(mockFileSystem.writeFile).toHaveBeenCalled();
		});

		it("should sanitize file names", async () => {
			const audioData = Buffer.from("test audio data");
			const fileName = "test@file#name$";

			mockFileSystem.writeFile.mockResolvedValue(undefined);

			await manager.saveAudioFile(audioData, fileName);

			const writeCall = mockFileSystem.writeFile.mock.calls[0];
			const savedFileName = writeCall[0].fsPath;
			expect(savedFileName).not.toContain("@");
			expect(savedFileName).not.toContain("#");
			expect(savedFileName).not.toContain("$");
		});

		it("should handle save errors gracefully", async () => {
			const audioData = Buffer.from("test audio data");
			const fileName = "test-file";

			mockFileSystem.writeFile.mockRejectedValue(new Error("Write failed"));

			const result = await manager.saveAudioFile(audioData, fileName);

			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
				expect.stringContaining("Failed to save audio file")
			);
			expect(result).toBeUndefined();
		});

		it("should open file when user selects Open", async () => {
			const audioData = Buffer.from("test audio data");
			const fileName = "test-file";

			mockFileSystem.writeFile.mockResolvedValue(undefined);
			(vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(
				"Open"
			);

			await manager.saveAudioFile(audioData, fileName);

			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
				"vscode.open",
				expect.any(Object)
			);
		});

		it("should open folder when user selects Open Folder", async () => {
			const audioData = Buffer.from("test audio data");
			const fileName = "test-file";

			mockFileSystem.writeFile.mockResolvedValue(undefined);
			(vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(
				"Open Folder"
			);

			await manager.saveAudioFile(audioData, fileName);

			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
				"revealFileInOS",
				expect.any(Object)
			);
		});
	});

	describe("cache operations", () => {
		describe("setAudioCache", () => {
			it("should cache audio data", async () => {
				const key = "test-key";
				const data = Buffer.from("test audio data");

				mockFileSystem.writeFile.mockResolvedValue(undefined);

				await manager.setAudioCache(key, data);

				expect(mockFileSystem.createDirectory).toHaveBeenCalled();
				expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
					expect.objectContaining({
						fsPath: expect.stringContaining(`${key}.bin`),
					}),
					data
				);
			});

			it("should update existing cache entry", async () => {
				const key = "test-key";
				const data1 = Buffer.from("test audio data 1");
				const data2 = Buffer.from("test audio data 2 longer");

				mockFileSystem.writeFile.mockResolvedValue(undefined);

				// Cache first data
				await manager.setAudioCache(key, data1);

				// Update with new data
				await manager.setAudioCache(key, data2);

				// Should write twice
				expect(mockFileSystem.writeFile).toHaveBeenCalledTimes(4); // 2 for data, 2 for metadata
			});

			it("should handle cache errors silently", async () => {
				const key = "test-key";
				const data = Buffer.from("test audio data");

				mockFileSystem.writeFile.mockRejectedValue(new Error("Write failed"));

				// Should not throw
				await expect(manager.setAudioCache(key, data)).resolves.not.toThrow();
			});
		});

		describe("getAudioCache", () => {
			it("should retrieve cached audio data", async () => {
				const key = "test-key";
				const data = Buffer.from("test audio data");

				// First cache the data
				mockFileSystem.writeFile.mockResolvedValue(undefined);
				await manager.setAudioCache(key, data);

				// Mock read to return the data
				mockFileSystem.readFile.mockResolvedValue(data);

				const result = await manager.getAudioCache(key);

				expect(result).toEqual(data);
				expect(mockFileSystem.readFile).toHaveBeenCalledWith(
					expect.objectContaining({
						fsPath: expect.stringContaining(`${key}.bin`),
					})
				);
			});

			it("should return undefined for non-existent key", async () => {
				const result = await manager.getAudioCache("non-existent");

				expect(result).toBeUndefined();
			});

			it("should handle read errors gracefully", async () => {
				const key = "test-key";
				const data = Buffer.from("test audio data");

				// First cache the data
				mockFileSystem.writeFile.mockResolvedValue(undefined);
				await manager.setAudioCache(key, data);

				// Mock read to fail
				mockFileSystem.readFile.mockRejectedValue(new Error("Read failed"));

				const result = await manager.getAudioCache(key);

				expect(result).toBeUndefined();
			});
		});

		describe("cache eviction", () => {
			it("should evict old entries when cache exceeds limit", async () => {
				// Create multiple large cache entries
				const largeData = Buffer.alloc(30 * 1024 * 1024); // 30MB each

				mockFileSystem.writeFile.mockResolvedValue(undefined);
				mockFileSystem.delete.mockResolvedValue(undefined);

				// Add entries with different timestamps
				jest.useFakeTimers();

				// Add first entry
				jest.setSystemTime(new Date("2024-01-01"));
				await manager.setAudioCache("old-entry", largeData);

				// Add second entry
				jest.setSystemTime(new Date("2024-01-02"));
				await manager.setAudioCache("newer-entry", largeData);

				// Add third entry
				jest.setSystemTime(new Date("2024-01-03"));
				await manager.setAudioCache("newest-entry", largeData);

				// Add fourth entry that should trigger eviction
				jest.setSystemTime(new Date("2024-01-04"));
				await manager.setAudioCache("trigger-eviction", largeData);

				// Should delete the oldest entry
				expect(mockFileSystem.delete).toHaveBeenCalledWith(
					expect.objectContaining({
						fsPath: expect.stringContaining("old-entry.bin"),
					})
				);

				jest.useRealTimers();
			});
		});
	});

	describe("readTextFile", () => {
		it("should read text file content", async () => {
			const uri = vscode.Uri.file("/test/file.txt");
			const content = "Hello, world!";

			mockFileSystem.readFile.mockResolvedValue(Buffer.from(content, "utf8"));

			const result = await manager.readTextFile(uri);

			expect(result).toBe(content);
			expect(mockFileSystem.readFile).toHaveBeenCalledWith(uri);
		});

		it("should handle different encodings", async () => {
			const uri = vscode.Uri.file("/test/file.txt");
			const content = "Hello, 世界!";

			mockFileSystem.readFile.mockResolvedValue(Buffer.from(content, "utf8"));

			const result = await manager.readTextFile(uri);

			expect(result).toBe(content);
		});
	});

	describe("cache metadata persistence", () => {
		it("should save metadata when cache is updated", async () => {
			const key = "test-key";
			const data = Buffer.from("test audio data");

			mockFileSystem.writeFile.mockResolvedValue(undefined);

			await manager.setAudioCache(key, data);

			// Check that metadata was written
			const metadataCall = mockFileSystem.writeFile.mock.calls.find((call) =>
				call[0].fsPath.includes("metadata.json")
			);
			expect(metadataCall).toBeDefined();

			const metadataContent = JSON.parse(metadataCall[1].toString());
			expect(metadataContent[key]).toBeDefined();
			expect(metadataContent[key].size).toBe(data.length);
		});

		it("should restore cache metadata on initialization", async () => {
			const metadata = {
				"test-key": {
					key: "test-key",
					size: 100,
					lastAccessed: Date.now(),
					uri: "/mock/storage/cache/test-key.bin",
				},
			};

			mockFileSystem.readFile.mockImplementation((uri) => {
				if (uri.fsPath.includes("metadata.json")) {
					return Promise.resolve(Buffer.from(JSON.stringify(metadata), "utf8"));
				}
				return Promise.resolve(Buffer.from("test data"));
			});

			// Create new instance to trigger initialization
			const newManager = new StorageManager(mockContext);

			// Allow initialization to complete
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Try to get cached data
			await newManager.getAudioCache("test-key");

			expect(mockFileSystem.readFile).toHaveBeenCalledWith(
				expect.objectContaining({
					fsPath: expect.stringContaining("metadata.json"),
				})
			);
		});
	});
});
