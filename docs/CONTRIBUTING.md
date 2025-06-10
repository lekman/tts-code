# Contributing to ElevenLabs Text-to-Speech for VSCode

Thank you for your interest in contributing! 

## Feature Requests

If you have an idea for a new feature, please [submit a feature request](https://github.com/lekman/tts-code/issues/new?template=feature_request.md) using our GitHub issue template.

Please follow the guidelines below to get started with development or contributing code.

## Development Mode

1. **Clone the repository:**

   ```bash
   git clone https://github.com/lekman/tts-code.git
   cd tts-code
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Open the project in VS Code**
   ```bash
   code .
   ```

2. **Run in development mode**
   - Press `F5` or go to Run → Start Debugging
   - This will open a new VS Code window with the extension loaded

3. **Make changes and reload**
   - Edit the source code
   - Press `Ctrl+R` (or `Cmd+R` on macOS) in the Extension Development Host window to reload


## Development and Testing Practices

### Code Style and Linting
- **Prettier** is used for code formatting. Key rules:
  - Tabs are used for indentation (`tabWidth: 2`, `useTabs: true`).
  - Line width is 80 characters (`printWidth: 80`).
  - Always use semicolons (`semi: true`).
  - Double quotes for strings (`singleQuote: false`).
  - Trailing commas where valid in ES5 (`trailingComma: es5`).
  - Arrow functions always include parentheses (`arrowParens: always`).
  - TypeScript parser is used for formatting (`parser: typescript`).
- **ESLint** enforces code quality and style:
  - TypeScript rules: no unused vars, no explicit `any`, no shadowing, etc.
  - JSDoc required for functions and classes.
  - Import order is alphabetized and grouped (builtin, external, internal, etc.).
  - No console logs in committed code.
  - Header comments are required on all files.
  - Prettier integration ensures formatting is enforced via linting.

### Testing Structure and Coverage
- Tests are organized in the `test/` directory:
  - `unit/` for unit tests (individual components)
  - `integration/` for integration tests (component interactions)
  - `e2e/` for end-to-end workflow tests
  - `__mocks__/` for VSCode and ElevenLabs API mocks
- Test file naming:
  - Unit: `{component}.test.ts`
  - Integration: `{feature}.integration.test.ts`
  - E2E: `{workflow}.e2e.test.ts`
- **Coverage requirements:**
  - Statements: 90%+
  - Functions: 90%+
  - Lines: 90%+
  - Branches: 50%+
- Coverage is enforced in CI and can be checked locally with `npm run test:coverage`.

### Running Tests
- Run all tests: `npm test`
- Run with coverage: `npm run test:coverage`
- Run specific suite: `npm test -- <pattern>`
- Watch mode: `npm test -- --watch`

### Manual Acceptance Testing
- Manual tests verify extension activation, command registration, API key management, TTS functionality, audio export, and error handling.
- See [docs/TEST.md](./TEST.md) for acceptance test cases and instructions.

### Best Practices
- Use descriptive test names ("should do X when Y").
- Test one behavior per test.
- Use Jest mocks for VSCode APIs and external dependencies.
- Group related tests with `describe` blocks.
- Clear mocks between tests with `afterEach`.
- Reference [docs/TESTING.md](./TESTING.md   ) and [docs/TEST.md](./TEST.md) for detailed examples and guidelines.


## Pull Request Process

1. **Fork the repository**
   - Click the "Fork" button on the [GitHub repo](https://github.com/lekman/tts-code) page.

2. **Clone your fork and create a new branch**
   - Make your changes in a feature branch.

3. **Push your changes to your fork**

4. **Open a pull request**
   - Go to your fork on GitHub and click "Compare & pull request".
   - Fill in a clear description of your changes.

5. **Requirements for merging**
   - All unit tests and linting checks must pass.
   - A code owner must approve the merge. See the [CODEOWNERS file](../.github/CODEOWNERS) for details.

## Automated CI/CD Pipelines

### Continuous Integration (CI)
- Every pull request and push runs automated tests and linting via GitHub Actions.
- Coverage is uploaded to Codecov for pushes to `main`.
- All checks must pass before merging.
- The main workflow file is `.github/workflows/ci.yml`.

### Continuous Deployment (CD)
- Merges to `main` trigger the release workflow (`.github/workflows/cd.yaml`).
- Releases are managed by the `release-please` bot, which creates release PRs and tags.
- If a release is created, the VSCode extension is built, tested, and published to the Visual Studio Marketplace automatically.
- Custom actions are used for building, testing, SBOM generation, and publishing.

### Security Analysis
- Code is regularly scanned for vulnerabilities using GitHub CodeQL (`.github/workflows/codeql.yaml`).
- Security analysis runs on every push/PR to `main` and on a daily schedule.

### Requirements for Merging
- All CI checks (tests, lint, coverage) must pass.
- Code must be reviewed and approved by a code owner.

### Secrets Required (for maintainers)
- `NPM_TOKEN` for publishing packages.
- `VS_MARKETPLACE_TOKEN` for publishing the VSCode extension.
- `CODECOV_TOKEN` for coverage reporting.

## Local Settings

Shared settings for the project are stored in the [.vscode](../.vscode) folder.

- Various "noise" files are hidden using the workspace settings. To show them, install the [Explorer Exclude Toggle](https://marketplace.visualstudio.com/items?itemName=KhrisGriffis.explorer-exclude-toggle), and run the command `Toggle Files Exclude (Show)` from the command palette.
