# Test Strategy

This document outlines the testing approach for the ElevenLabs Text-to-Speech for VSCode extension, including automated unit tests, continuous integration (CI) checks, and manual acceptance tests.

[![Continuous Integration](https://github.com/lekman/tts-code/actions/workflows/ci.yml/badge.svg)](https://github.com/lekman/tts-code/actions/workflows/ci.yml) 
[![codecov](https://codecov.io/gh/lekman/tts-code/graph/badge.svg?token=hDIxvefcrD)](https://codecov.io/gh/lekman/tts-code)

## 1. Unit Tests

- **Scope:**
  - All core modules in `src/` (e.g., `audioManager.ts`, `highlightManager.ts`, `storageManager.ts`, `webviewProvider.ts`, `extension.ts`).
  - Each exported function and class method is covered by at least one test.
  - Mocks are used for VSCode APIs and external dependencies (e.g., ElevenLabs API).
- **What we run:**
  - All tests in the `test/` directory using Jest.
  - Coverage thresholds are enforced for statements, branches, functions, and lines.
  - Linting is run before tests to ensure code quality.

---

## 2. Continuous Integration (CI)

- **Scope:**
  - All unit tests (see above)
  - Linting (`eslint`)
  - TypeScript compilation
  - Security audit (`npm audit --audit-level=moderate`)
- **What we run:**
  - On every push and pull request:
    - `npm audit --audit-level=moderate`
    - `npm run lint:fix`
    - `npm run compile`
    - `npm run test`
  - Coverage and linting must pass for CI to succeed.

---

## 3. Manual Acceptance Tests

- **Scope:**
  - Full end-to-end testing of the extension in VSCode.
  - Verifies real user workflows and integration with the ElevenLabs API.

### Acceptance Test Cases

#### 3.1. Extension Activation and Command Registration
1. Install the extension in VSCode (run in Extension Development Host).
2. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
3. Verify the following commands are available:
   - TTS: Speak Text
   - TTS: Speak Selection
   - TTS: Pause/Resume
   - TTS: Skip Forward
   - TTS: Skip Backward
   - TTS: Export Audio
   - TTS: Reset API Key

#### 3.2. API Key Management
1. Trigger a TTS command without an API key set.
2. Verify the extension prompts for the ElevenLabs API key.
3. Enter a valid key and confirm it is accepted.
4. Enter an invalid key and confirm an error is shown.

#### 3.3. Text-to-Speech Functionality
1. Open a Markdown or plaintext file.
2. Select a block of text.
3. Run the "TTS: Speak Selection" command.
4. Verify that audio playback starts and the correct text is spoken.
5. Use the playback controls (Pause/Resume, Skip Forward/Backward) and verify they work as expected.

#### 3.4. Audio Export
1. Run the "TTS: Export Audio" command after generating speech.
2. Choose a location to save the audio file.
3. Verify the file is saved and can be played back in a media player.

#### 3.5. Error Handling
1. Disconnect from the internet and run a TTS command.
2. Verify that a user-friendly error message is shown.
3. Reconnect and retry to confirm normal operation resumes.

---

## 4. Additional Notes
- All acceptance tests should be run on the latest supported version of VSCode on macOS, Windows, and Linux.
- For any failed acceptance test, create an issue with reproduction steps and logs if available. 