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

import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
	// Set up basic configuration for Jest
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/test"],
	testMatch: ["**/*.test.ts"],

	// Transform TypeScript files
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				tsconfig: "tsconfig.json",
				diagnostics: {
					warnOnly: true,
				},
			},
		],
	},

	// Module name mapping for imports
	moduleNameMapper: {
		"^vscode$": "<rootDir>/test/__mocks__/vscode.js",
		"^@/(.*)$": "<rootDir>/src/$1",
		"^@models/(.*)$": "<rootDir>/src/models/$1",
		"^@services/(.*)$": "<rootDir>/src/services/$1",
		"^@repositories/(.*)$": "<rootDir>/src/repositories/$1",
		"^@interfaces/(.*)$": "<rootDir>/src/interfaces/$1",
		"^@errors/(.*)$": "<rootDir>/src/errors/$1",
		"\\.(css|gif|ttf|eot|svg|png)$": "jest-transform-stub",
		"^@mocks/(.*)$": "<rootDir>/test/mocks/$1",
		"^@dtos/(.*)$": "<rootDir>/src/dtos/$1",
		"^@maps/(.*)$": "<rootDir>/src/maps/$1",
		"^@ops/(.*)$": "<rootDir>/src/ops/$1",
		"^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
	},

	// Add module directories for path resolution
	moduleDirectories: ["node_modules", "src"],

	// Ignore certain paths
	testPathIgnorePatterns: [
		"<rootDir>/dist/",
		"<rootDir>/node_modules/",
		"<rootDir>/coverage/",
		"<rootDir>/dist/test/",
		// Skip e2e tests in CI environment
		...(process.env.CI || process.env.GITHUB_ACTIONS
			? ["<rootDir>/test/__e2e__/"]
			: []),
	],

	// Coverage configuration
	collectCoverage: true,
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/**/*.d.ts",
		"!src/**/*.test.ts",
		"!src/**/*.spec.ts",
		"!src/**/__tests__/**",
		"!src/**/__mocks__/**",
		"!src/**/index.ts",
		"!**/node_modules/**",
		"!**/dist/**",
		"!**/coverage/**",
		"!**/test/**",
		"!src/**/*.config.ts",
		"!src/**/constants.ts",
		"!src/**/enums.ts",
		"!src/**/types.ts",
		"!src/**/migrations/**/*",
		"!src/**/seed/**/*",
		"!src/**/fixtures/**/*",
		"!src/app.module.ts",
		"!src/main.ts",
		"!src/setup.ts",
		"!src/ops/**",
	],
	coverageDirectory: "coverage",
	coverageReporters: ["json-summary", "json", "lcov", "text", "clover", "html"],
	coverageThreshold: {
		global: {
			statements: 75,
			functions: 50,
			lines: 75,
			branches: 50,
		},
	},

	// JUnit reporter configuration
	reporters: [
		"default",
		[
			"jest-junit",
			{
				outputDirectory: "coverage",
				outputName: "junit.xml",
				classNameTemplate: "{classname}",
				titleTemplate: "{title}",
				ancestorSeparator: ".",
				suiteNameTemplate: (vars: { filename?: string }) => {
					const filename = vars.filename || "";
					const suiteName = filename.replace(/\.test\.ts$/, "");
					return suiteName;
				},
			},
		],
		[
			"jest-html-reporter",
			{
				pageTitle: "SecNord GRC Database Test Report",
				outputPath: "coverage/test-report.html",
				includeFailureMsg: true,
				includeSuiteFailure: true,
				includeConsoleLog: true,
				styleOverridePath: null,
				useCssFile: true,
				includeStackTrace: true,
				executionTimeWarningThreshold: 5,
			},
		],
	],

	// Setup files
	setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],

	modulePathIgnorePatterns: ["<rootDir>/dist/"],

	globalSetup: "<rootDir>/test/global-setup.ts",
	verbose: true,
	forceExit: true,
	detectOpenHandles: true,
};

export default config;
