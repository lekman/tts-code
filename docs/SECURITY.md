# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in the ElevenLabs Text-to-Speech for VSCode extension, please [raise an issue](https://github.com/lekman/tts-code/issues/new?template=security-incident.md) in the repository. Clearly describe the issue, steps to reproduce, and any relevant details. If the issue is sensitive, you may request a private disclosure channel in your issue description.

## Dependency and Vulnerability Management

[![GitHub Advanced Security](https://github.com/lekman/tts-code/actions/workflows/codeql.yaml/badge.svg)](https://github.com/lekman/tts-code/actions/workflows/codeql.yaml)

- We regularly test all dependencies for known vulnerabilities using `npm audit` and other automated tools.
- GitHub Advanced Security is enabled for this repository and is integrated into our pull request and continuous integration (CI) workflows.
- Dependency and vulnerability checks are automatically run on every pull request and on a regular schedule to detect and address issues as early as possible.

## Privacy

We do not collect any data from users. All API keys are stored securely on the user's local machine using VSCode's [SecretStorage API](https://code.visualstudio.com/api/references/vscode-api#SecretStorage). This means:

- **Local Storage Only:** The API key is never transmitted to our servers or any third party. It remains on your device at all times.
- **Secure Storage:** VSCode's SecretStorage encrypts secrets (such as API keys) and stores them in a secure location managed by the operating system (e.g., Keychain on macOS, Credential Manager on Windows, or a secure file on Linux).
- **Access Control:** Only the extension that stored the secret can retrieve it. Other extensions or applications cannot access your API key.
- **User Control:** You can remove the API key at any time by using the extension's settings or by clearing secrets in VSCode. You can also press `Ctrl+Shift+P` and type `TTS: Reset API Key` to clear the API key from the extension.
