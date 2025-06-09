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

import { ApiKeyManager } from "../src/apiKeyManager";

// Mock vscode module
jest.mock("vscode");

// Mock fetch
global.fetch = jest.fn();

describe("ApiKeyManager", () => {
	let apiKeyManager: ApiKeyManager;
	let mockContext: any;
	let mockSecretStorage: any;
	let mockShowInputBox: jest.Mock;
	let mockShowInformationMessage: jest.Mock;
	let mockShowErrorMessage: jest.Mock;
	let mockWithProgress: jest.Mock;

	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();

		// Setup secret storage mock
		mockSecretStorage = {
			get: jest.fn(),
			store: jest.fn().mockResolvedValue(undefined),
			delete: jest.fn().mockResolvedValue(undefined),
		};

		// Setup context mock
		mockContext = {
			secrets: mockSecretStorage,
		};

		// Setup vscode mocks
		mockShowInputBox = jest.fn();
		mockShowInformationMessage = jest.fn();
		mockShowErrorMessage = jest.fn();
		mockWithProgress = jest.fn((_options, callback) => callback());

		// Override the mocked functions instead of the entire window object
		vscode.window.showInputBox = mockShowInputBox;
		vscode.window.showInformationMessage = mockShowInformationMessage;
		vscode.window.showErrorMessage = mockShowErrorMessage;
		vscode.window.withProgress = mockWithProgress;

		// Create instance
		apiKeyManager = new ApiKeyManager(mockContext);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe("constructor", () => {
		it("should initialize with the provided context", () => {
			expect(apiKeyManager).toBeInstanceOf(ApiKeyManager);
		});
	});

	describe("getApiKey", () => {
		it("should retrieve API key from secret storage", async () => {
			const testKey = "xi_test_key_123";
			mockSecretStorage.get.mockResolvedValue(testKey);

			const result = await apiKeyManager.getApiKey();

			expect(mockSecretStorage.get).toHaveBeenCalledWith("elevenlabs-api-key");
			expect(result).toBe(testKey);
		});

		it("should return undefined if no key is stored", async () => {
			mockSecretStorage.get.mockResolvedValue(undefined);

			const result = await apiKeyManager.getApiKey();

			expect(result).toBeUndefined();
		});
	});

	describe("setApiKey", () => {
		it("should store API key in secret storage", async () => {
			const testKey = "xi_test_key_123";

			await apiKeyManager.setApiKey(testKey);

			expect(mockSecretStorage.store).toHaveBeenCalledWith(
				"elevenlabs-api-key",
				testKey
			);
		});
	});

	describe("deleteApiKey", () => {
		it("should delete API key from secret storage", async () => {
			await apiKeyManager.deleteApiKey();

			expect(mockSecretStorage.delete).toHaveBeenCalledWith(
				"elevenlabs-api-key"
			);
		});
	});

	describe("validateApiKey", () => {
		it("should return true for valid API key", async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				status: 200,
			});

			const result = await apiKeyManager.validateApiKey("xi_valid_key");

			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.elevenlabs.io/v1/user",
				{
					method: "GET",
					headers: {
						"xi-api-key": "xi_valid_key",
						"Content-Type": "application/json",
					},
				}
			);
			expect(result).toBe(true);
		});

		it("should return false for invalid API key", async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 401,
			});

			const result = await apiKeyManager.validateApiKey("xi_invalid_key");

			expect(result).toBe(false);
		});

		it("should return false on network error", async () => {
			(global.fetch as jest.Mock).mockRejectedValueOnce(
				new Error("Network error")
			);

			const result = await apiKeyManager.validateApiKey("xi_test_key");

			expect(result).toBe(false);
		});
	});

	describe("promptForApiKey", () => {
		it("should store and return valid API key", async () => {
			const testKey = "xi_valid_test_key_123";
			mockShowInputBox.mockResolvedValue(testKey);
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				status: 200,
			});

			const result = await apiKeyManager.promptForApiKey();

			expect(mockShowInputBox).toHaveBeenCalledWith({
				prompt: "Enter your ElevenLabs API key",
				placeHolder: "sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
				password: true,
				ignoreFocusOut: true,
				validateInput: expect.any(Function),
			});
			expect(mockWithProgress).toHaveBeenCalled();
			expect(mockSecretStorage.store).toHaveBeenCalledWith(
				"elevenlabs-api-key",
				testKey
			);
			expect(mockShowInformationMessage).toHaveBeenCalledWith(
				"API key saved successfully!"
			);
			expect(result).toBe(testKey);
		});

		it("should show error for invalid API key", async () => {
			const testKey = "xi_invalid_test_key";
			mockShowInputBox.mockResolvedValue(testKey);
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 401,
			});

			const result = await apiKeyManager.promptForApiKey();

			expect(mockShowErrorMessage).toHaveBeenCalledWith(
				"Invalid API key. Please check your key and try again."
			);
			expect(mockSecretStorage.store).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it("should return undefined if user cancels", async () => {
			mockShowInputBox.mockResolvedValue(undefined);

			const result = await apiKeyManager.promptForApiKey();

			expect(result).toBeUndefined();
			expect(mockSecretStorage.store).not.toHaveBeenCalled();
		});

		it("should validate input format", async () => {
			mockShowInputBox.mockResolvedValue("xi_valid_key");

			await apiKeyManager.promptForApiKey();

			const validateInput = mockShowInputBox.mock.calls[0][0].validateInput;

			expect(validateInput("")).toBe("API key cannot be empty");
			expect(validateInput("   ")).toBe("API key cannot be empty");
			expect(validateInput("invalid_key")).toBe(
				"Invalid API key format. ElevenLabs API keys start with two lowercase letters followed by underscore (e.g., sk_, xi_)"
			);
			expect(validateInput("xi_")).toBe(
				"Invalid API key format. ElevenLabs API keys start with two lowercase letters followed by underscore (e.g., sk_, xi_)"
			);
			expect(validateInput("xi_valid_key_123")).toBeNull();
			expect(validateInput("sk_valid_key_123")).toBeNull();
		});
	});

	describe("ensureApiKey", () => {
		it("should return existing API key if available", async () => {
			const testKey = "xi_existing_key";
			mockSecretStorage.get.mockResolvedValue(testKey);

			const result = await apiKeyManager.ensureApiKey();

			expect(result).toBe(testKey);
			expect(mockShowInformationMessage).not.toHaveBeenCalled();
		});

		it("should prompt for API key if none exists and user agrees", async () => {
			const testKey = "xi_new_key";
			mockSecretStorage.get.mockResolvedValue(undefined);
			mockShowInformationMessage.mockResolvedValue("Enter API Key");
			mockShowInputBox.mockResolvedValue(testKey);
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				status: 200,
			});

			const result = await apiKeyManager.ensureApiKey();

			expect(mockShowInformationMessage).toHaveBeenCalledWith(
				"No ElevenLabs API key found. Would you like to enter one now?",
				"Enter API Key",
				"Later"
			);
			expect(result).toBe(testKey);
		});

		it("should return undefined if user chooses 'Later'", async () => {
			mockSecretStorage.get.mockResolvedValue(undefined);
			mockShowInformationMessage.mockResolvedValue("Later");

			const result = await apiKeyManager.ensureApiKey();

			expect(result).toBeUndefined();
			expect(mockShowInputBox).not.toHaveBeenCalled();
		});
	});

	describe("resetApiKey", () => {
		it("should delete existing key and prompt for new one", async () => {
			const newKey = "xi_new_key_after_reset";
			mockShowInputBox.mockResolvedValue(newKey);
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				status: 200,
			});

			const result = await apiKeyManager.resetApiKey();

			expect(mockSecretStorage.delete).toHaveBeenCalledWith(
				"elevenlabs-api-key"
			);
			expect(mockShowInformationMessage).toHaveBeenCalledWith(
				"API key has been cleared."
			);
			expect(result).toBe(newKey);
		});

		it("should return undefined if user cancels after reset", async () => {
			mockShowInputBox.mockResolvedValue(undefined);

			const result = await apiKeyManager.resetApiKey();

			expect(mockSecretStorage.delete).toHaveBeenCalled();
			expect(result).toBeUndefined();
		});
	});
});
