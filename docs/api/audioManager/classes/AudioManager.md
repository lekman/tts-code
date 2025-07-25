[**SecNord GRC Service + API v1.3.2**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [audioManager](../README.md) / AudioManager

# Class: AudioManager

Defined in: audioManager.ts:44

Manages audio playback and generation for the TTS extension.
Handles integration with ElevenLabs API and audio caching.

## Constructors

### Constructor

> **new AudioManager**(): `AudioManager`

#### Returns

`AudioManager`

## Properties

### audioCache

> `private` **audioCache**: `Map`\<`string`, `Buffer`\>

Defined in: audioManager.ts:45

***

### currentAudioData?

> `private` `optional` **currentAudioData**: `Buffer`

Defined in: audioManager.ts:46

***

### currentCacheSize

> `private` **currentCacheSize**: `number` = `0`

Defined in: audioManager.ts:47

***

### currentDuration

> `private` **currentDuration**: `number` = `0`

Defined in: audioManager.ts:48

***

### currentPlaybackState

> `private` **currentPlaybackState**: [`PlaybackState`](../type-aliases/PlaybackState.md) = `"stopped"`

Defined in: audioManager.ts:49

***

### currentPosition

> `private` **currentPosition**: `number` = `0`

Defined in: audioManager.ts:50

***

### elevenLabsClient?

> `private` `optional` **elevenLabsClient**: [`ElevenLabsClient`](../../elevenLabsClient/classes/ElevenLabsClient.md)

Defined in: audioManager.ts:51

***

### eventEmitter

> `private` **eventEmitter**: `EventEmitter`\<[`PlaybackEvent`](../interfaces/PlaybackEvent.md)\>

Defined in: audioManager.ts:52

***

### MAX\_CACHE\_SIZE

> `private` `readonly` **MAX\_CACHE\_SIZE**: `number`

Defined in: audioManager.ts:53

***

### webviewProvider?

> `private` `optional` **webviewProvider**: [`WebviewProvider`](../../webviewProvider/classes/WebviewProvider.md)

Defined in: audioManager.ts:54

## Accessors

### onPlaybackStateChanged

#### Get Signature

> **get** **onPlaybackStateChanged**(): `Event`\<[`PlaybackEvent`](../interfaces/PlaybackEvent.md)\>

Defined in: audioManager.ts:214

Gets the playback state changed event.

##### Returns

`Event`\<[`PlaybackEvent`](../interfaces/PlaybackEvent.md)\>

The event emitter.

## Methods

### dispose()

> **dispose**(): `void`

Defined in: audioManager.ts:60

Cleans up resources used by the AudioManager.

#### Returns

`void`

***

### generateAudio()

> **generateAudio**(`text`, `cacheKey`, `voiceId?`): `Promise`\<`Buffer`\>

Defined in: audioManager.ts:79

Generates audio from text using ElevenLabs API.

#### Parameters

##### text

`string`

The text to convert to speech.

##### cacheKey

`string`

A unique key for caching the audio.

##### voiceId?

`string`

Optional voice ID to use.

#### Returns

`Promise`\<`Buffer`\>

Promise resolving to audio data buffer.

***

### generateAudioChunked()

> **generateAudioChunked**(`text`, `cacheKey`, `voiceId?`, `onProgress?`): `Promise`\<`Buffer`\>

Defined in: audioManager.ts:116

Generates audio for large texts by chunking.

#### Parameters

##### text

`string`

The text to convert to speech.

##### cacheKey

`string`

A unique key for caching the audio.

##### voiceId?

`string`

Optional voice ID to use.

##### onProgress?

(`progress`, `message`) => `void`

Optional progress callback.

#### Returns

`Promise`\<`Buffer`\>

Promise resolving to combined audio data buffer.

***

### getAvailableVoices()

> **getAvailableVoices**(): `Promise`\<`Voice`[]\>

Defined in: audioManager.ts:159

Gets available voices from the ElevenLabs API.

#### Returns

`Promise`\<`Voice`[]\>

Array of available voices.

***

### getCurrentAudioData()

> **getCurrentAudioData**(): `Buffer`

Defined in: audioManager.ts:173

Gets the current audio data.

#### Returns

`Buffer`

The current audio buffer or undefined.

***

### getCurrentDuration()

> **getCurrentDuration**(): `number`

Defined in: audioManager.ts:181

Gets the current audio duration.

#### Returns

`number`

The duration in seconds.

***

### getCurrentPosition()

> **getCurrentPosition**(): `number`

Defined in: audioManager.ts:189

Gets the current playback position.

#### Returns

`number`

The current position in seconds.

***

### getPlaybackState()

> **getPlaybackState**(): [`PlaybackState`](../type-aliases/PlaybackState.md)

Defined in: audioManager.ts:197

Gets the current playback state.

#### Returns

[`PlaybackState`](../type-aliases/PlaybackState.md)

The current state.

***

### initialize()

> **initialize**(`apiKey`): `void`

Defined in: audioManager.ts:206

Initializes the AudioManager with an API key.

#### Parameters

##### apiKey

`string`

The ElevenLabs API key.

#### Returns

`void`

***

### pause()

> **pause**(): `void`

Defined in: audioManager.ts:222

Pauses audio playback.

#### Returns

`void`

***

### play()

> **play**(`audioData`, `startPosition`): `void`

Defined in: audioManager.ts:233

Plays audio starting from a specific position.

#### Parameters

##### audioData

`Buffer`

The audio data to play.

##### startPosition

`number` = `0`

The position to start from in seconds.

#### Returns

`void`

***

### resume()

> **resume**(): `void`

Defined in: audioManager.ts:261

Resumes audio playback.

#### Returns

`void`

***

### setWebviewProvider()

> **setWebviewProvider**(`webviewProvider`): `void`

Defined in: audioManager.ts:271

Sets the webview provider for audio playback.

#### Parameters

##### webviewProvider

[`WebviewProvider`](../../webviewProvider/classes/WebviewProvider.md)

The webview provider instance.

#### Returns

`void`

***

### skipBackward()

> **skipBackward**(`seconds`): `void`

Defined in: audioManager.ts:280

Skips backward in the audio.

#### Parameters

##### seconds

`number` = `10`

Number of seconds to skip backward.

#### Returns

`void`

***

### skipForward()

> **skipForward**(`seconds`): `void`

Defined in: audioManager.ts:290

Skips forward in the audio.

#### Parameters

##### seconds

`number` = `10`

Number of seconds to skip forward.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: audioManager.ts:303

Stops audio playback.

#### Returns

`void`

***

### updatePosition()

> **updatePosition**(`position`): `void`

Defined in: audioManager.ts:314

Updates the playback position from the webview.

#### Parameters

##### position

`number`

The new position in seconds.

#### Returns

`void`

***

### cacheAudio()

> `private` **cacheAudio**(`key`, `data`): `void`

Defined in: audioManager.ts:325

Caches audio data with LRU eviction.

#### Parameters

##### key

`string`

The cache key.

##### data

`Buffer`

The audio data to cache.

#### Returns

`void`

***

### sendAudioToWebview()

> `private` **sendAudioToWebview**(`audioData`): `void`

Defined in: audioManager.ts:356

Sends audio data to the webview for playback.

#### Parameters

##### audioData

`Buffer`

The audio data to send.

#### Returns

`void`
