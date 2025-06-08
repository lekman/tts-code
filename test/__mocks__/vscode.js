// Create a reusable EventEmitter mock
const createEventEmitter = () => {
	const eventHandler = jest.fn();
	const fire = jest.fn();
	const dispose = jest.fn();
	
	return {
		fire,
		event: eventHandler,
		dispose,
	};
};

module.exports = {
	window: {
		showInformationMessage: jest.fn(),
		showErrorMessage: jest.fn(),
		showWarningMessage: jest.fn(),
		showInputBox: jest.fn(),
		withProgress: jest.fn((options, callback) => callback()),
		activeTextEditor: null,
		registerWebviewViewProvider: jest.fn(() => ({ dispose: jest.fn() })),
		createTextEditorDecorationType: jest.fn(() => ({
			dispose: jest.fn(),
		})),
	},
	commands: {
		registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
		executeCommand: jest.fn(),
	},
	ExtensionContext: class {},
	EventEmitter: jest.fn().mockImplementation(function() {
		const emitter = createEventEmitter();
		this.fire = emitter.fire;
		this.event = emitter.event;
		this.dispose = emitter.dispose;
		return this;
	}),
	Range: jest.fn((start, end) => ({ start, end })),
	ProgressLocation: {
		Notification: 10,
	},
};