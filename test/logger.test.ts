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

import { Logger, ErrorHandler } from "../src/logger";

describe("Logger", () => {
	let mockOutputChannel: any;
	let mockConfig: any;
	let appendLineSpy: jest.Mock;
	let showSpy: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock output channel
		appendLineSpy = jest.fn();
		showSpy = jest.fn();
		mockOutputChannel = {
			appendLine: appendLineSpy,
			show: showSpy,
			dispose: jest.fn(),
		};

		// Mock vscode.window.createOutputChannel
		(vscode.window.createOutputChannel as jest.Mock).mockReturnValue(
			mockOutputChannel
		);

		// Mock workspace configuration
		mockConfig = {
			get: jest.fn().mockReturnValue("info"),
		};
		(vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(
			mockConfig
		);
	});

	describe("initialize", () => {
		it("should create output channel with correct name", () => {
			Logger.initialize();
			expect(vscode.window.createOutputChannel).toHaveBeenCalledWith(
				"ElevenLabs TTS"
			);
		});

		it("should set log level from configuration", () => {
			mockConfig.get.mockReturnValue("debug");
			Logger.initialize();
			expect(mockConfig.get).toHaveBeenCalledWith("logLevel", "info");
		});

		it("should default to INFO level if config is invalid", () => {
			mockConfig.get.mockReturnValue("invalid");
			Logger.initialize();

			// Test that info messages are logged
			Logger.info("test");
			expect(appendLineSpy).toHaveBeenCalled();
		});
	});

	describe("logging methods", () => {
		// TODO: Fix mock state management issue - the test works in isolation but fails when run with other tests
		// it("should log debug messages when level is DEBUG", () => {
		// 	mockConfig.get.mockReturnValue("debug");
		// 	Logger.initialize();

		// 	// Get the appendLine method from the newly created output channel
		// 	const newOutputChannel = (vscode.window.createOutputChannel as jest.Mock)
		// 		.mock.results[
		// 		(vscode.window.createOutputChannel as jest.Mock).mock.results.length - 1
		// 	].value;
		// 	const newAppendLineSpy = newOutputChannel.appendLine;

		// 	const message = "Debug message";
		// 	Logger.debug(message);

		// 	expect(newAppendLineSpy).toHaveBeenCalledWith(
		// 		expect.stringContaining("[DEBUG] Debug message")
		// 	);
		// });

		it("should not log debug messages when level is INFO", () => {
			mockConfig.get.mockReturnValue("info");
			Logger.initialize();

			Logger.debug("Debug message");
			expect(appendLineSpy).not.toHaveBeenCalled();
		});

		it("should log info messages when level is INFO or lower", () => {
			Logger.initialize();
			const message = "Info message";
			Logger.info(message);

			expect(appendLineSpy).toHaveBeenCalledWith(
				expect.stringContaining("[INFO] Info message")
			);
		});

		it("should log warning messages when level is WARN or lower", () => {
			Logger.initialize();
			const message = "Warning message";
			Logger.warn(message);

			expect(appendLineSpy).toHaveBeenCalledWith(
				expect.stringContaining("[WARN] Warning message")
			);
		});

		it("should log error messages with stack trace", () => {
			Logger.initialize();
			const error = new Error("Test error");
			Logger.error("Error occurred", error);

			expect(appendLineSpy).toHaveBeenCalledWith(
				expect.stringContaining("[ERROR] Error occurred")
			);
			expect(appendLineSpy).toHaveBeenCalledWith(
				expect.stringContaining(error.stack || "")
			);
		});

		it("should include timestamp in log messages", () => {
			Logger.initialize();
			Logger.info("Test message");

			const call = appendLineSpy.mock.calls[0][0];
			expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
		});
	});

	describe("show", () => {
		it("should show the output channel", () => {
			Logger.initialize();
			Logger.show();
			expect(showSpy).toHaveBeenCalled();
		});
	});

	describe("dispose", () => {
		it("should dispose the output channel", () => {
			Logger.initialize();
			const disposeSpy = mockOutputChannel.dispose;
			Logger.dispose();
			expect(disposeSpy).toHaveBeenCalled();
		});
	});
});

describe("ErrorHandler", () => {
	let mockShowErrorMessage: jest.Mock;
	let loggerErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock vscode.window.showErrorMessage
		mockShowErrorMessage = jest.fn().mockResolvedValue(undefined);
		(vscode.window.showErrorMessage as jest.Mock) = mockShowErrorMessage;

		// Spy on Logger.error
		loggerErrorSpy = jest.spyOn(Logger, "error").mockImplementation(() => {
			// Mock implementation
		});

		// Initialize logger
		Logger.initialize();
	});

	afterEach(() => {
		loggerErrorSpy.mockRestore();
	});

	describe("handleError", () => {
		it("should log the error", () => {
			const error = new Error("Test error");
			const userMessage = "Something went wrong";

			ErrorHandler.handleError(error, userMessage);

			expect(loggerErrorSpy).toHaveBeenCalledWith(userMessage, error);
		});

		it("should show notification when showNotification is true", () => {
			const error = new Error("Test error");
			const userMessage = "Something went wrong";

			ErrorHandler.handleError(error, userMessage, true);

			expect(mockShowErrorMessage).toHaveBeenCalledWith(
				userMessage,
				"Show Logs"
			);
		});

		it("should not show notification when showNotification is false", () => {
			const error = new Error("Test error");
			const userMessage = "Something went wrong";

			ErrorHandler.handleError(error, userMessage, false);

			expect(mockShowErrorMessage).not.toHaveBeenCalled();
		});

		it("should handle non-Error objects", () => {
			const error = "String error";
			const userMessage = "Something went wrong";

			ErrorHandler.handleError(error, userMessage);

			expect(loggerErrorSpy).toHaveBeenCalledWith(
				userMessage,
				expect.any(Error)
			);
		});

		it("should show logs when Show Logs is clicked", async () => {
			mockShowErrorMessage.mockResolvedValue("Show Logs");
			const showSpy = jest.spyOn(Logger, "show").mockImplementation(() => {
				// Mock implementation
			});

			const error = new Error("Test error");
			ErrorHandler.handleError(error, "Error", true);

			// Wait for promise to resolve
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(showSpy).toHaveBeenCalled();
			showSpy.mockRestore();
		});
	});

	describe("withErrorHandling", () => {
		it("should return result on successful operation", async () => {
			const result = "success";
			const operation = jest.fn().mockResolvedValue(result);

			const actual = await ErrorHandler.withErrorHandling(
				operation,
				"Error message"
			);

			expect(actual).toBe(result);
			expect(operation).toHaveBeenCalled();
		});

		it("should return undefined and handle error on failure", async () => {
			const error = new Error("Operation failed");
			const operation = jest.fn().mockRejectedValue(error);

			const actual = await ErrorHandler.withErrorHandling(
				operation,
				"Error message"
			);

			expect(actual).toBeUndefined();
			expect(loggerErrorSpy).toHaveBeenCalledWith("Error message", error);
		});

		it("should respect showNotification parameter", async () => {
			const error = new Error("Operation failed");
			const operation = jest.fn().mockRejectedValue(error);

			await ErrorHandler.withErrorHandling(operation, "Error message", false);

			expect(mockShowErrorMessage).not.toHaveBeenCalled();
		});
	});

	describe("getUserFriendlyMessage", () => {
		it("should return user-friendly message for API key errors", () => {
			const error = new Error("Invalid API key provided");
			const message = ErrorHandler.getUserFriendlyMessage(error);
			expect(message).toBe(
				"API key is missing or invalid. Please check your settings."
			);
		});

		it("should return user-friendly message for rate limit errors", () => {
			const error = new Error("rate limit exceeded");
			const message = ErrorHandler.getUserFriendlyMessage(error);
			expect(message).toBe("Rate limit exceeded. Please try again later.");
		});

		it("should return user-friendly message for network errors", () => {
			const error = new Error("network error occurred");
			const message = ErrorHandler.getUserFriendlyMessage(error);
			expect(message).toBe(
				"Network error. Please check your internet connection."
			);
		});

		it("should return user-friendly message for timeout errors", () => {
			const error = new Error("Request timeout");
			const message = ErrorHandler.getUserFriendlyMessage(error);
			expect(message).toBe("Request timed out. Please try again.");
		});

		it("should return original message for unknown errors", () => {
			const error = new Error("Some other error");
			const message = ErrorHandler.getUserFriendlyMessage(error);
			expect(message).toBe("Some other error");
		});

		it("should handle non-Error objects", () => {
			const message = ErrorHandler.getUserFriendlyMessage("String error");
			expect(message).toBe("An unexpected error occurred");
		});
	});
});
