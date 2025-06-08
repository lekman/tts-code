module.exports = {
	window: {
		showInformationMessage: jest.fn(),
		activeTextEditor: null,
		registerWebviewViewProvider: jest.fn(() => ({ dispose: jest.fn() })),
	},
	commands: {
		registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
	},
	ExtensionContext: class {},
};
