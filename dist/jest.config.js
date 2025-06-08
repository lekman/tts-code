"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/test"],
    testMatch: ["**/*.test.ts"],
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
    moduleNameMapper: {
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
    moduleDirectories: ["node_modules", "src"],
    testPathIgnorePatterns: [
        "<rootDir>/dist/",
        "<rootDir>/node_modules/",
        "<rootDir>/coverage/",
        "<rootDir>/dist/test/",
        ...(process.env.CI || process.env.GITHUB_ACTIONS
            ? ["<rootDir>/test/__e2e__/"]
            : []),
    ],
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
            statements: 90,
            functions: 90,
            lines: 90,
            branches: 50,
        },
    },
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
                suiteNameTemplate: (vars) => {
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
    setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
    modulePathIgnorePatterns: ["<rootDir>/dist/"],
    globalSetup: "<rootDir>/test/global-setup.ts",
    verbose: true,
    forceExit: true,
    detectOpenHandles: true,
};
exports.default = config;
//# sourceMappingURL=jest.config.js.map