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
 * Log levels for controlling output verbosity
 */
export enum LogLevel {
	DEBUG,
	INFO,
	WARN,
	ERROR,
}

/**
 * Logger class for managing extension logging
 */
export class Logger {
	private static logLevel: LogLevel = LogLevel.INFO;
	private static outputChannel: vscode.OutputChannel;

	/**
	 * Log a debug message
	 * @param {string} message The message to log
	 */
	static debug(message: string): void {
		if (this.logLevel <= LogLevel.DEBUG) {
			this.log("DEBUG", message);
		}
	}

	/**
	 * Dispose of the output channel
	 */
	static dispose(): void {
		if (this.outputChannel) {
			this.outputChannel.dispose();
		}
	}

	/**
	 * Log an error message
	 * @param {string} message The message to log
	 * @param {Error} [error] Optional error object to log
	 */
	static error(message: string, error?: Error): void {
		if (this.logLevel <= LogLevel.ERROR) {
			this.log("ERROR", message);
			if (error) {
				this.log("ERROR", error.stack || error.toString());
			}
		}
	}

	/**
	 * Log an info message
	 * @param {string} message The message to log
	 */
	static info(message: string): void {
		if (this.logLevel <= LogLevel.INFO) {
			this.log("INFO", message);
		}
	}

	/**
	 * Initialize the logger with VS Code output channel
	 */
	static initialize(): void {
		this.outputChannel = vscode.window.createOutputChannel("ElevenLabs TTS");

		// Set log level from configuration
		const config = vscode.workspace.getConfiguration("elevenlabs-tts");
		const configLevel = config.get<string>("logLevel", "info").toUpperCase();
		this.logLevel =
			LogLevel[configLevel as keyof typeof LogLevel] || LogLevel.INFO;
	}

	/**
	 * Show the output channel
	 */
	static show(): void {
		this.outputChannel.show();
	}

	/**
	 * Log a warning message
	 * @param {string} message The message to log
	 */
	static warn(message: string): void {
		if (this.logLevel <= LogLevel.WARN) {
			this.log("WARN", message);
		}
	}

	/**
	 * Internal logging method
	 * @param {string} level The log level
	 * @param {string} message The message to log
	 */
	private static log(level: string, message: string): void {
		const timestamp = new Date().toISOString();
		this.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}`);
	}
}

/**
 * Error handler utility class for consistent error handling
 */
export class ErrorHandler {
	/**
	 * Create a user-friendly error message from an error object
	 * @param {unknown} error The error object
	 * @returns {string} A user-friendly error message
	 */
	static getUserFriendlyMessage(error: unknown): string {
		if (error instanceof Error) {
			// Handle specific error types
			if (error.message.includes("API key")) {
				return "API key is missing or invalid. Please check your settings.";
			}
			if (error.message.includes("rate limit")) {
				return "Rate limit exceeded. Please try again later.";
			}
			if (
				error.message.includes("network") ||
				error.message.includes("fetch")
			) {
				return "Network error. Please check your internet connection.";
			}
			if (error.message.includes("timeout")) {
				return "Request timed out. Please try again.";
			}
			// Default to the error message
			return error.message;
		}
		return "An unexpected error occurred";
	}

	/**
	 * Handle an error with logging and optional user notification
	 * @param {unknown} error The error to handle
	 * @param {string} userMessage User-friendly error message
	 * @param {boolean} [showNotification=true] Whether to show a notification to the user
	 * @returns {unknown} The original error
	 */
	static handleError(
		error: unknown,
		userMessage: string,
		showNotification = true
	): unknown {
		// Log the error
		Logger.error(
			userMessage,
			error instanceof Error ? error : new Error(String(error))
		);

		// Show user notification if requested
		if (showNotification) {
			const actions = ["Show Logs"];
			const result = vscode.window.showErrorMessage(userMessage, ...actions);
			if (result && typeof result.then === "function") {
				result.then((selection) => {
					if (selection === "Show Logs") {
						Logger.show();
					}
				});
			}
		}

		// Return the error for further handling
		return error;
	}

	/**
	 * Wrap an async operation with error handling
	 * @param {() => Promise<T>} operation The async operation to execute
	 * @param {string} errorMessage Error message to show if operation fails
	 * @param {boolean} [showNotification=true] Whether to show a notification on error
	 * @returns {Promise<T | undefined>} The result of the operation or undefined on error
	 */
	static async withErrorHandling<T>(
		operation: () => Promise<T>,
		errorMessage: string,
		showNotification = true
	): Promise<T | undefined> {
		try {
			return await operation();
		} catch (error) {
			this.handleError(error, errorMessage, showNotification);
			return undefined;
		}
	}
}
