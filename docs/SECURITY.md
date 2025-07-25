# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in the ElevenLabs Text-to-Speech for VSCode extension, please [raise an issue](https://github.com/lekman/tts-code/issues/new?template=security-incident.md) in the repository. Clearly describe the issue, steps to reproduce, and any relevant details. If the issue is sensitive, you may request a private disclosure channel in your issue description.

## Security Incident Transparency

We believe in complete transparency when it comes to security incidents. As part of our commitment to building trust and improving security practices across the development community, we document and publicly report all security incidents that occur in this project.

### Incident Reporting and Documentation

All security incidents, regardless of severity, are:
- Documented as GitHub issues with detailed incident reports
- Tagged with the `security` label for easy identification
- Include comprehensive Root Cause Analysis (RCA) when applicable
- Remain publicly visible as a learning resource for the community

You can [view all current and historical security incidents](https://github.com/lekman/tts-code/issues?q=label%3A%22security%22) for this project.


### Why We Practice Transparency

1. **Accountability**: Public documentation holds us accountable for addressing security issues promptly and thoroughly
2. **Learning**: Other developers can learn from our experiences and avoid similar issues
3. **Trust**: Transparency builds trust with users and contributors
4. **Continuous Improvement**: Public scrutiny helps us improve our security practices

## Dependency and Vulnerability Management

[![GitHub Advanced Security](https://github.com/lekman/tts-code/actions/workflows/codeql.yaml/badge.svg)](https://github.com/lekman/tts-code/actions/workflows/codeql.yaml)

- We regularly test all dependencies for known vulnerabilities using automated tools.
- GitHub Advanced Security is enabled for this repository and is integrated into our pull request and continuous integration (CI) workflows.
- Dependency and vulnerability checks are automatically run on every pull request and on a regular schedule to detect and address issues as early as possible.

## Privacy

We do not collect any data from users. All API keys are stored securely on the user's local machine using VSCode's [SecretStorage API](https://code.visualstudio.com/api/references/vscode-api#SecretStorage). This means:

- **Local Storage Only:** The API key is never transmitted to our servers or any third party. It remains on your device at all times.
- **Secure Storage:** VSCode's SecretStorage encrypts secrets (such as API keys) and stores them in a secure location managed by the operating system (e.g., Keychain on macOS, Credential Manager on Windows, or a secure file on Linux).
- **Access Control:** Only the extension that stored the secret can retrieve it. Other extensions or applications cannot access your API key.
- **User Control:** You can remove the API key at any time by using the extension's settings or by clearing secrets in VSCode. You can also press `Ctrl+Shift+P` and type `TTS: Reset API Key` to clear the API key from the extension.
