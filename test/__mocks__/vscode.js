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
	ConfigurationTarget: {
		Global: 1,
		Workspace: 2,
		WorkspaceFolder: 3
	},
	window: {
		showInformationMessage: jest.fn(),
		showErrorMessage: jest.fn(),
		showWarningMessage: jest.fn(),
		showInputBox: jest.fn(),
		showQuickPick: jest.fn(),
		withProgress: jest.fn((options, callback) => {
			const progress = {
				report: jest.fn()
			};
			return Promise.resolve(callback(progress));
		}),
		activeTextEditor: null,
		registerWebviewViewProvider: jest.fn(() => ({ dispose: jest.fn() })),
		createTextEditorDecorationType: jest.fn(() => ({
			dispose: jest.fn(),
		})),
		createOutputChannel: jest.fn(() => ({
			appendLine: jest.fn(),
			show: jest.fn(),
			dispose: jest.fn(),
		})),
	},
	commands: {
		registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
		executeCommand: jest.fn().mockResolvedValue(undefined),
	},
	workspace: {
		getConfiguration: jest.fn(() => ({
			get: jest.fn((key, defaultValue) => defaultValue),
			has: jest.fn(),
			update: jest.fn(),
		})),
		fs: {
			readFile: jest.fn(),
			writeFile: jest.fn(),
			delete: jest.fn(),
			createDirectory: jest.fn(),
		},
	},
	Uri: {
		file: jest.fn((path) => ({ fsPath: path, toString: () => path })),
		parse: jest.fn((str) => ({ fsPath: str, toString: () => str })),
		joinPath: jest.fn((base, ...paths) => ({
			fsPath: [base.fsPath || base, ...paths].join('/'),
			toString: () => [base.fsPath || base, ...paths].join('/'),
		})),
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
	TextEditorRevealType: {
		Default: 0,
		InCenter: 1,
		InCenterIfOutsideViewport: 2,
		AtTop: 3,
	},
};