module.exports = {
	window: {
		showInformationMessage: jest.fn(),
		activeTextEditor: null,
	},
	commands: {
		registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
	},
	ExtensionContext: class {},
};
