# ElevenLabs Text-to-Speech for VSCode

## Project Background

ElevenLabs Text-to-Speech for VSCode is a developer-focused extension that brings high-quality voice synthesis directly into your coding environment. Designed for developers, technical writers, and accessibility-focused users, this extension enables you to listen to markdown and text files with advanced playback controls, synchronized text highlighting, and audio export capabilities. The project aims to reduce eye strain, improve documentation review workflows, and make VSCode more accessible for all users.

Key features include:
- Seamless integration with VSCode for .md and .txt files
- Editor title bar icon and context menu for quick access
- Playback controls and visual highlighting in a custom webview
- Secure API key management using VSCode SecretStorage
- Audio export in MP3 format for offline listening

## Installation

### Local Installation (Without Marketplace)

To install this extension locally for development or testing:

1. **Clone the repository**
   ```bash
   git clone https://github.com/lekman/tts-code.git
   cd tts-code
   ```

2. **Optional: Package the extension**

    If you want include any recent changes to the extension, you can run the following commands:

    Mac/Linux:

   ```bash
   npm install && ln -s docs/LICENSE LICENSE && npx vsce package && mkdir -p package && mv -f *.vsix package/
   ```

    Windows:

    ```bash
    npm install && ln -s docs/LICENSE LICENSE && npx vsce package && mkdir -p package && mv -f *.vsix package/
    ```

3. **Install in VS Code or Cursor**

   **Option A: Using Command Line (Recommended)**
   ```bash
   # For VS Code
   code --install-extension package/tts-code-1.0.0.vsix
   
   # For Cursor
   cursor --install-extension package/tts-code-1.0.0.vsix
   ```

   **Option B: Using GUI**
   - Open VS Code or Cursor
   - Open the Command Palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux)
   - Type "Extensions: Install from VSIX..."
   - Select the `.vsix` file from the `package` directory
   - Reload when prompted

### Development Mode

For active development with hot reload:

1. **Open the project in VS Code**
   ```bash
   code .
   ```

2. **Run in development mode**
   - Press `F5` or go to Run → Start Debugging
   - This will open a new VS Code window with the extension loaded

3. **Make changes and reload**
   - Edit the source code
   - Press `Ctrl+R` (or `Cmd+R` on macOS) in the Extension Development Host window to reload

### Prerequisites

- Node.js 20.x or higher
- VS Code 1.74.0 or higher
- An ElevenLabs API key (get one at [elevenlabs.io](https://elevenlabs.io))

## Product Requirements

For a detailed overview of the goals, features, technical requirements, and implementation plan, see the [Product Requirements Document (PRD)](./PRD.md).

## Code Documentation

For detailed API and module documentation, see the [Code Documentation](./api/README.md).

## Testing

For our test strategy, CI checks, and manual acceptance test instructions, see the [Test Strategy](./TEST.md).
