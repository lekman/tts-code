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

const eslint = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const prettier = require("eslint-plugin-prettier");
const jsdoc = require("eslint-plugin-jsdoc");
const headers = require("eslint-plugin-headers");
const importPlugin = require("eslint-plugin-import");
const jest = require("eslint-plugin-jest");
const perfectionist = require("eslint-plugin-perfectionist");

module.exports = [
	{
		ignores: ["dist/**", "node_modules/**", "build/**", "**/*.js", "**/*.mjs"],
	},
	eslint.configs.recommended,
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
				project: ["tsconfig.json"],
			},
			globals: {
				// Node globals
				process: "readonly",
				__dirname: "readonly",
				module: "readonly",
				require: "readonly",
				// Jest globals
				describe: "readonly",
				it: "readonly",
				expect: "readonly",
				beforeEach: "readonly",
				afterEach: "readonly",
				beforeAll: "readonly",
				afterAll: "readonly",
				test: "readonly",
				jest: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
			prettier: prettier,
			jsdoc: jsdoc,
			headers: headers,
			import: importPlugin,
			jest: jest,
			perfectionist: perfectionist,
		},
		rules: {
			// TypeScript rules
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_" },
			],
			"no-unused-vars": "off",
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/no-shadow": "error",
			"@typescript-eslint/no-empty-interface": "warn",
			"@typescript-eslint/no-empty-function": "warn",
			"@typescript-eslint/no-var-requires": "off",
			"@typescript-eslint/ban-ts-comment": "warn",
			"@typescript-eslint/interface-name-prefix": "off",
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/explicit-module-boundary-types": "off",

			// Prettier
			"prettier/prettier": ["error", {}, { usePrettierrc: true }],

			// JSDoc
			"jsdoc/check-alignment": "warn",
			"jsdoc/check-indentation": "off",
			"jsdoc/require-jsdoc": [
				"error",
				{
					require: {
						FunctionDeclaration: true,
						MethodDefinition: false, // Disabled because we have JSDoc on methods but eslint doesn't recognize them
						ClassDeclaration: true,
					},
				},
			],
			"jsdoc/require-param-type": "error",
			"jsdoc/require-returns-type": "error",
			"jsdoc/check-tag-names": "warn",
			"jsdoc/check-types": "warn",
			"jsdoc/require-param": "warn",
			"jsdoc/require-returns": "warn",
			"jsdoc/valid-types": "warn",

			// Headers
			"headers/header-format": [
				"error",
				{
					source: "string",
					content: [
						"ElevenLabs Text-to-Speech for VSCode",
						"Copyright(C) 2025 Tobias Lekman",
						"",
						"This program is free software: you can redistribute it and/or modify",
						"it under the terms of the GNU General Public License as published by",
						"the Free Software Foundation, either version 3 of the License, or",
						"(at your option) any later version.",
						"This program is distributed in the hope that it will be useful,",
						"but WITHOUT ANY WARRANTY; without even the implied warranty of",
						"MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the",
						"GNU General Public License for more details.",
						"You should have received a copy of the GNU General Public License",
						"along with this program. If not, see <https://www.gnu.org/licenses/>.",
						"For feature requests, and FAQs, please visit:",
						"https://github.com/lekman/tts-code",
					].join("\n"),
					trailingNewlines: 2,
				},
			],

			// Import
			"import/no-extraneous-dependencies": "error",
			"import/no-duplicates": "error",
			"import/no-mutable-exports": "error",
			"import/no-unused-modules": "error",
			"import/no-useless-path-segments": "error",
			"import/no-default-export": "off",
			"import/no-anonymous-default-export": "error",
			"import/order": [
				"error",
				{
					groups: [
						"builtin",
						"external",
						"internal",
						["parent", "sibling"],
						"index",
						"object",
						"type",
					],
					"newlines-between": "always",
					alphabetize: {
						order: "asc",
						caseInsensitive: true,
					},
				},
			],

			// Jest
			"jest/expect-expect": "warn",
			"jest/no-disabled-tests": "warn",
			"jest/no-focused-tests": "error",
			"jest/no-identical-title": "error",
			"jest/prefer-to-have-length": "warn",
			"jest/valid-expect": "error",

			// Other
			"no-console": "error",
			"no-shadow": "off",
			"no-underscore-dangle": "off",

			// Perfectionist
			"perfectionist/sort-classes": [
				"error",
				{
					type: "alphabetical",
					order: "asc",
					ignoreCase: true,
					groups: [
						"static-property",
						"protected-static-property",
						"private-static-property",
						"property",
						"protected-property",
						"private-property",
						"constructor",
						"static-method",
						"protected-static-method",
						"private-static-method",
						"method",
						"protected-method",
						"private-method",
						"unknown",
					],
				},
			],
			"@typescript-eslint/member-ordering": "off",
		},
	},
	{
		files: [
			"test/**/*.ts",
			"test/**/*.js",
			"test/__sit__/**/*.ts",
			"scripts/**/*.ts",
			"scripts/**/*.js",
		],
		rules: {
			"no-console": "off",
			"no-undef": "off",
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
	{
		files: ["test/__e2e__/**/*.test.ts"],
		rules: {
			"jest/expect-expect": "off",
		},
	},
];