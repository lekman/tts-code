[**SecNord GRC Service + API v1.0.0**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [elevenLabsClient](../README.md) / ElevenLabsClient

# Class: ElevenLabsClient

Defined in: elevenLabsClient.ts:58

Client wrapper for the ElevenLabs SDK.
Provides a simplified interface for text-to-speech operations with chunking support.

## Constructors

### Constructor

> **new ElevenLabsClient**(`apiKey`, `defaultVoiceId?`): `ElevenLabsClient`

Defined in: elevenLabsClient.ts:71

Creates a new ElevenLabsClient instance.

#### Parameters

##### apiKey

`string`

The ElevenLabs API key for authentication.

##### defaultVoiceId?

`string`

Optional default voice ID to use.

#### Returns

`ElevenLabsClient`

## Properties

### DEFAULT\_MODEL\_ID

> `private` `readonly` `static` **DEFAULT\_MODEL\_ID**: `"eleven_monolingual_v1"` = `"eleven_monolingual_v1"`

Defined in: elevenLabsClient.ts:59

***

### DEFAULT\_VOICE\_ID

> `private` `readonly` `static` **DEFAULT\_VOICE\_ID**: `"21m00Tcm4TlvDq8ikWAM"` = `"21m00Tcm4TlvDq8ikWAM"`

Defined in: elevenLabsClient.ts:60

***

### MAX\_CHUNK\_SIZE

> `private` `readonly` `static` **MAX\_CHUNK\_SIZE**: `4000` = `4000`

Defined in: elevenLabsClient.ts:61

***

### client

> `private` **client**: `ElevenLabsClient`

Defined in: elevenLabsClient.ts:63

***

### defaultVoiceId

> `private` **defaultVoiceId**: `string`

Defined in: elevenLabsClient.ts:64

## Methods

### getVoices()

> **getVoices**(): `Promise`\<`Voice`[]\>

Defined in: elevenLabsClient.ts:82

Gets the list of available voices from the API.

#### Returns

`Promise`\<`Voice`[]\>

Array of voice objects.

***

### setDefaultVoiceId()

> **setDefaultVoiceId**(`voiceId`): `void`

Defined in: elevenLabsClient.ts:113

Updates the default voice ID.

#### Parameters

##### voiceId

`string`

The new default voice ID.

#### Returns

`void`

***

### textToSpeech()

> **textToSpeech**(`text`, `voiceId?`, `format?`, `voiceSettings?`): `Promise`\<`Buffer`\>

Defined in: elevenLabsClient.ts:126

Converts text to speech using the ElevenLabs API.

#### Parameters

##### text

`string`

The text to convert to speech.

##### voiceId?

`string`

Optional voice ID to use (defaults to instance default).

##### format?

[`AudioFormat`](../type-aliases/AudioFormat.md) = `"mp3_44100_128"`

Optional audio format (defaults to mp3_44100_128).

##### voiceSettings?

`VoiceSettings`

Optional voice settings for stability and similarity.

#### Returns

`Promise`\<`Buffer`\>

The generated audio data as a Buffer.

#### Throws

If the API request fails.

***

### textToSpeechChunked()

> **textToSpeechChunked**(`text`, `voiceId?`, `format?`, `voiceSettings?`, `onProgress?`): `Promise`\<`Buffer`[]\>

Defined in: elevenLabsClient.ts:208

Handles large texts by splitting them into chunks and processing each chunk.

#### Parameters

##### text

`string`

The text to convert to speech.

##### voiceId?

`string`

Optional voice ID to use.

##### format?

[`AudioFormat`](../type-aliases/AudioFormat.md) = `"mp3_44100_128"`

Optional audio format.

##### voiceSettings?

`VoiceSettings`

Optional voice settings.

##### onProgress?

(`progress`, `message`) => `void`

Optional callback for progress updates.

#### Returns

`Promise`\<`Buffer`[]\>

Array of audio buffers for each chunk.

***

### splitTextIntoChunks()

> `private` **splitTextIntoChunks**(`text`): `string`[]

Defined in: elevenLabsClient.ts:264

Splits text into chunks at sentence boundaries when possible.

#### Parameters

##### text

`string`

The text to split.

#### Returns

`string`[]

Array of text chunks.
