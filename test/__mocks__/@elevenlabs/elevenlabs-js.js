// Mock implementation of @elevenlabs/elevenlabs-js
const mockTextToSpeechConvert = jest.fn();
const mockVoicesGetAll = jest.fn();

class MockElevenLabsClient {
	constructor(config) {
		this.config = config;
		this.textToSpeech = {
			convert: mockTextToSpeechConvert,
		};
		this.voices = {
			getAll: mockVoicesGetAll,
		};
	}
}

// Export the mock functions for test access
MockElevenLabsClient.__mockTextToSpeechConvert = mockTextToSpeechConvert;
MockElevenLabsClient.__mockVoicesGetAll = mockVoicesGetAll;

module.exports = {
	ElevenLabsClient: MockElevenLabsClient,
	__mockTextToSpeechConvert: mockTextToSpeechConvert,
	__mockVoicesGetAll: mockVoicesGetAll,
};