[**SecNord GRC Service + API v0.0.1**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [audioManager](../README.md) / AudioManager

# Class: AudioManager

Defined in: audioManager.ts:22

Manages audio playback, processing, and control for the TTS extension.

## Constructors

### Constructor

> **new AudioManager**(): `AudioManager`

Defined in: audioManager.ts:26

Initializes a new instance of the AudioManager.

#### Returns

`AudioManager`

## Methods

### pauseAudio()

> **pauseAudio**(): `Promise`\<`void`\>

Defined in: audioManager.ts:34

Pauses the currently playing audio.

#### Returns

`Promise`\<`void`\>

***

### playAudio()

> **playAudio**(`_text`): `Promise`\<`void`\>

Defined in: audioManager.ts:43

Plays audio generated from the provided text.

#### Parameters

##### \_text

`string`

The text to convert to speech and play.

#### Returns

`Promise`\<`void`\>

***

### stopAudio()

> **stopAudio**(): `Promise`\<`void`\>

Defined in: audioManager.ts:51

Stops the currently playing audio.

#### Returns

`Promise`\<`void`\>
