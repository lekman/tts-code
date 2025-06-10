# Testing Guide for ElevenLabs TTS Extension

## Overview

This document provides comprehensive guidelines for testing the ElevenLabs Text-to-Speech VS Code extension. Our testing framework uses Jest with TypeScript support and includes unit tests, integration tests, and end-to-end tests.

## Test Structure

```
test/
├── __mocks__/              # Mock implementations
│   ├── vscode.js          # VS Code API mocks
│   └── @elevenlabs/       # ElevenLabs SDK mocks
├── unit/                  # Unit tests for individual components
├── integration/           # Integration tests for component interactions
├── e2e/                   # End-to-end workflow tests
├── setup.ts               # Test environment setup
└── global-setup.ts        # Global test configuration
```

## Running Tests

### All Tests
```bash
npm test                   # Run all tests without coverage
npm run test:coverage      # Run all tests with coverage report
```

### Specific Test Suites
```bash
npm test -- audioManager   # Run tests matching "audioManager"
npm test -- --watch       # Run tests in watch mode
```

### Coverage Requirements
- **Statements**: 90% minimum
- **Functions**: 90% minimum  
- **Lines**: 90% minimum
- **Branches**: 50% minimum

Current coverage exceeds these thresholds at ~94% overall.

## Test Categories

### 1. Unit Tests
Test individual components in isolation with mocked dependencies.

**Example**: `audioManager.test.ts`
```typescript
describe("AudioManager", () => {
  it("should generate audio when initialized", async () => {
    const audioManager = new AudioManager();
    audioManager.initialize("test-api-key");
    
    jest.spyOn(ElevenLabsClient.prototype, "textToSpeech")
      .mockResolvedValue(Buffer.from("audio-data"));
    
    const result = await audioManager.generateAudio("test text", "cache-key");
    expect(result).toBeDefined();
  });
});
```

### 2. Integration Tests
Test interactions between multiple components.

**Example**: `extension.integration.test.ts`
```typescript
describe("Extension Integration", () => {
  it("should handle complete command execution", async () => {
    activate(mockContext);
    
    // Set up editor with content
    vscode.window.activeTextEditor = createMockEditor("# Test");
    
    // Execute command
    await vscode.commands.executeCommand("ttsCode.speakText");
    
    // Verify integration
    expect(AudioManager.prototype.generateAudio).toHaveBeenCalled();
    expect(WebviewProvider.prototype.postMessage).toHaveBeenCalled();
  });
});
```

### 3. End-to-End Tests
Test complete user workflows from start to finish.

**Example**: `workflows.e2e.test.ts`
```typescript
describe("Complete TTS Workflow", () => {
  it("should complete: open file → generate → play → export", async () => {
    // Activate extension
    activate(mockContext);
    
    // Open markdown file
    const editor = await openFile("test.md");
    
    // Generate audio
    await executeCommand("ttsCode.speakText");
    
    // Verify playback controls
    expectWebviewMessage({ type: "loadAudio" });
    
    // Test export
    await triggerExport("mp3");
    expectFileCreated("test.mp3");
  });
});
```

## Mocking Strategy

### VS Code API Mock
Located in `test/__mocks__/vscode.js`, provides a complete mock of the VS Code API:

```javascript
module.exports = {
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
  },
  window: {
    showInformationMessage: jest.fn(),
    createOutputChannel: jest.fn(),
    // ... other window APIs
  },
  // ... other VS Code namespaces
};
```

### Component Mocks
Use Jest's mocking capabilities for internal components:

```typescript
jest.mock("../src/audioManager");
jest.mock("../src/elevenLabsClient");
```

## Writing New Tests

### 1. Test File Naming
- Unit tests: `{component}.test.ts`
- Integration tests: `{feature}.integration.test.ts`
- E2E tests: `{workflow}.e2e.test.ts`

### 2. Test Structure
```typescript
describe("ComponentName", () => {
  // Setup
  beforeEach(() => {
    // Initialize mocks and test data
  });
  
  // Teardown
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  // Group related tests
  describe("methodName", () => {
    it("should handle normal case", () => {
      // Arrange
      const input = "test";
      
      // Act
      const result = component.method(input);
      
      // Assert
      expect(result).toBe("expected");
    });
    
    it("should handle error case", () => {
      // Test error scenarios
    });
  });
});
```

### 3. Best Practices

#### Use Descriptive Test Names
```typescript
// ❌ Bad
it("should work", () => {});

// ✅ Good
it("should generate audio when valid API key is provided", () => {});
```

#### Test One Thing at a Time
```typescript
// ❌ Bad - testing multiple behaviors
it("should validate and generate audio", () => {
  expect(apiKey).toBeDefined();
  expect(audio).toBeDefined();
});

// ✅ Good - separate tests
it("should validate API key", () => {
  expect(apiKey).toBeDefined();
});

it("should generate audio after validation", () => {
  expect(audio).toBeDefined();
});
```

#### Use AAA Pattern
```typescript
it("should handle large files", () => {
  // Arrange
  const largeText = "x".repeat(10000);
  
  // Act
  const result = processText(largeText);
  
  // Assert
  expect(result).toHaveLength(5000); // Chunked
});
```

## Coverage Analysis

### Viewing Coverage Reports
After running tests with coverage:

1. **Console Output**: Summary in terminal
2. **HTML Report**: Open `coverage/index.html`
3. **VS Code**: Install Coverage Gutters extension

### Improving Coverage

1. **Identify Uncovered Lines**
   ```bash
   npm run test:coverage
   ```
   Look for files with < 90% coverage

2. **Add Targeted Tests**
   Focus on:
   - Error handling paths
   - Edge cases
   - Conditional branches

3. **Example: Testing Error Paths**
   ```typescript
   it("should handle network errors gracefully", async () => {
     // Force network error
     jest.spyOn(ElevenLabsClient.prototype, "textToSpeech")
       .mockRejectedValue(new Error("Network error"));
     
     // Should not throw
     await expect(audioManager.generateAudio("text"))
       .rejects.toThrow("Network error");
   });
   ```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Release builds

### GitHub Actions Configuration
```yaml
- name: Run Tests
  run: |
    npm ci
    npm run lint
    npm run test:coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/coverage-final.json
```

## Debugging Tests

### 1. VS Code Debugger
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "${file}"],
  "console": "integratedTerminal"
}
```

### 2. Focused Tests
```typescript
// Run only this test
it.only("should focus on this test", () => {});

// Skip this test
it.skip("should skip this test", () => {});
```

### 3. Debugging Tips
- Use `console.log` for quick debugging
- Check mock call arguments: `expect(mock).toHaveBeenCalledWith(...)`
- Verify mock setup: `console.log(mockFunction.mock.calls)`

## Performance Testing

### Load Testing Example
```typescript
describe("Performance", () => {
  it("should handle 10MB files efficiently", async () => {
    const largeContent = "x".repeat(10 * 1024 * 1024);
    
    const startTime = Date.now();
    await audioManager.generateAudio(largeContent);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000); // < 5 seconds
  });
});
```

## Common Issues and Solutions

### 1. Module Not Found
```
Cannot find module '../src/component'
```
**Solution**: Check `tsconfig.json` paths and Jest `moduleNameMapper`

### 2. Async Test Timeout
```
Timeout - Async callback was not invoked
```
**Solution**: Increase timeout or check for hanging promises
```typescript
it("long running test", async () => {
  // test code
}, 10000); // 10 second timeout
```

### 3. Mock Not Working
```
TypeError: mockFunction is not a function
```
**Solution**: Ensure mock is set up before import
```typescript
jest.mock("../src/module"); // Must be before import
import { Module } from "../src/module";
```

## Test Maintenance

### Regular Tasks
1. **Update Tests with Code Changes**
   - Add tests for new features
   - Update tests for modified behavior
   - Remove tests for deleted code

2. **Review Coverage Trends**
   - Monitor coverage metrics
   - Investigate coverage drops
   - Add tests for new code paths

3. **Refactor Test Code**
   - Extract common test utilities
   - Update deprecated Jest APIs
   - Improve test performance

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing VS Code Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [TypeScript Testing](https://www.typescriptlang.org/docs/handbook/testing.html)
- [Test Coverage Best Practices](https://kentcdodds.com/blog/write-tests)