[**SecNord GRC Service + API v0.0.1**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [storageManager](../README.md) / StorageManager

# Class: StorageManager

Defined in: storageManager.ts:25

Manages file operations, caching, and audio export for the TTS extension.

## Constructors

### Constructor

> **new StorageManager**(`_context`): `StorageManager`

Defined in: storageManager.ts:30

Creates a new StorageManager instance.

#### Parameters

##### \_context

`ExtensionContext`

The VSCode extension context for accessing storage locations.

#### Returns

`StorageManager`

## Properties

### \_context

> `private` `readonly` **\_context**: `ExtensionContext`

Defined in: storageManager.ts:30

The VSCode extension context for accessing storage locations.

## Methods

### getAudioCache()

> **getAudioCache**(`_key`): `Promise`\<`Uint8Array`\>

Defined in: storageManager.ts:37

Retrieves audio data from the cache by key.

#### Parameters

##### \_key

`string`

The cache key for the audio data.

#### Returns

`Promise`\<`Uint8Array`\>

The cached audio data, or undefined if not found.

***

### saveAudioFile()

> **saveAudioFile**(`_data`, `_fileName`): `Promise`\<`Uri`\>

Defined in: storageManager.ts:48

Saves an audio file to a user-specified location.

#### Parameters

##### \_data

`Uint8Array`

The audio data to save.

##### \_fileName

`string`

The name of the file to save.

#### Returns

`Promise`\<`Uri`\>

The URI of the saved file, or undefined if not saved.

***

### setAudioCache()

> **setAudioCache**(`_key`, `_data`): `Promise`\<`void`\>

Defined in: storageManager.ts:62

Caches audio data for later retrieval.

#### Parameters

##### \_key

`string`

The cache key to associate with the audio data.

##### \_data

`Uint8Array`

The audio data to cache.

#### Returns

`Promise`\<`void`\>
