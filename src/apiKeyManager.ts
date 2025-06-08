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

/**
 * Manages the storage, retrieval, and validation of ElevenLabs API keys.
 * Uses VSCode's SecretStorage API for secure key storage.
 */
export class ApiKeyManager {
	private static readonly API_KEY_SECRET = "elevenlabs-api-key";
	private static readonly ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";
	private secretStorage: vscode.SecretStorage;

	/**
	 * Creates a new ApiKeyManager instance.
	 * @param {vscode.ExtensionContext} context - The VSCode extension context for accessing SecretStorage.
	 */
	constructor(context: vscode.ExtensionContext) {
		this.secretStorage = context.secrets;
	}

	/**
	 * Deletes the stored API key from secure storage.
	 * @returns {Promise<void>}
	 */
	public async deleteApiKey(): Promise<void> {
		await this.secretStorage.delete(ApiKeyManager.API_KEY_SECRET);
	}

	/**
	 * Ensures an API key is available, prompting the user if necessary.
	 * @returns {Promise<string | undefined>} The API key if available or entered, undefined otherwise.
	 */
	public async ensureApiKey(): Promise<string | undefined> {
		let apiKey = await this.getApiKey();

		if (!apiKey) {
			// No stored key, prompt for one
			const action = await vscode.window.showInformationMessage(
				"No ElevenLabs API key found. Would you like to enter one now?",
				"Enter API Key",
				"Later"
			);

			if (action === "Enter API Key") {
				apiKey = await this.promptForApiKey();
			}
		}

		return apiKey;
	}

	/**
	 * Retrieves the stored API key from secure storage.
	 * @returns {Promise<string | undefined>} The API key if found, undefined otherwise.
	 */
	public async getApiKey(): Promise<string | undefined> {
		return this.secretStorage.get(ApiKeyManager.API_KEY_SECRET);
	}

	/**
	 * Prompts the user to enter their API key and validates it.
	 * If valid, stores the key in secure storage.
	 * @returns {Promise<string | undefined>} The validated API key if successful, undefined otherwise.
	 */
	public async promptForApiKey(): Promise<string | undefined> {
		const apiKey = await vscode.window.showInputBox({
			prompt: "Enter your ElevenLabs API key",
			placeHolder: "sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
			password: true,
			ignoreFocusOut: true,
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return "API key cannot be empty";
				}
				// Basic format validation - ElevenLabs keys typically start with two lowercase letters followed by underscore
				const keyPattern = /^[a-z]{2}_/;
				if (!keyPattern.test(value) || value.length < 10) {
					return "Invalid API key format. ElevenLabs API keys start with two lowercase letters followed by underscore (e.g., sk_, xi_)";
				}
				return null;
			},
		});

		if (!apiKey) {
			return undefined;
		}

		// Show progress while validating
		return vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: "Validating API key...",
				cancellable: false,
			},
			async () => {
				const isValid = await this.validateApiKey(apiKey);
				if (isValid) {
					await this.setApiKey(apiKey);
					vscode.window.showInformationMessage("API key saved successfully!");
					return apiKey;
				} else {
					vscode.window.showErrorMessage(
						"Invalid API key. Please check your key and try again."
					);
					return undefined;
				}
			}
		);
	}

	/**
	 * Clears the stored API key and prompts for a new one.
	 * @returns {Promise<string | undefined>} The new API key if entered, undefined otherwise.
	 */
	public async resetApiKey(): Promise<string | undefined> {
		await this.deleteApiKey();
		vscode.window.showInformationMessage("API key has been cleared.");
		return this.promptForApiKey();
	}

	/**
	 * Stores the API key in secure storage.
	 * @param {string} apiKey - The API key to store.
	 * @returns {Promise<void>}
	 */
	public async setApiKey(apiKey: string): Promise<void> {
		await this.secretStorage.store(ApiKeyManager.API_KEY_SECRET, apiKey);
	}

	/**
	 * Validates an API key by making a test request to the ElevenLabs API.
	 * @param {string} apiKey - The API key to validate.
	 * @returns {Promise<boolean>} True if the API key is valid, false otherwise.
	 */
	public async validateApiKey(apiKey: string): Promise<boolean> {
		try {
			// Make a simple request to the user endpoint to validate the key
			const response = await fetch(`${ApiKeyManager.ELEVENLABS_API_URL}/user`, {
				method: "GET",
				headers: {
					"xi-api-key": apiKey,
					"Content-Type": "application/json",
				},
			});

			// If we get a 200 response, the key is valid
			return response.ok;
		} catch {
			// Network errors or other issues
			return false;
		}
	}
}
