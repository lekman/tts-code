[**SecNord GRC Service + API v1.3.2**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [storageManager](../README.md) / StorageManager

# Class: StorageManager

Defined in: storageManager.ts:31

Manages file operations, caching, and audio export for the TTS extension.

## Constructors

### Constructor

> **new StorageManager**(`context`): `StorageManager`

Defined in: storageManager.ts:40

Creates a new StorageManager instance.

#### Parameters

##### context

`ExtensionContext`

The VSCode extension context for accessing storage locations.

#### Returns

`StorageManager`

## Properties

### cacheMetadata

> `private` **cacheMetadata**: `Map`\<`string`, `CacheEntry`\>

Defined in: storageManager.ts:32

***

### cacheSize

> `private` **cacheSize**: `number` = `0`

Defined in: storageManager.ts:33

***

### MAX\_CACHE\_SIZE

> `private` `readonly` **MAX\_CACHE\_SIZE**: `number`

Defined in: storageManager.ts:34

***

### context

> `private` `readonly` **context**: `ExtensionContext`

Defined in: storageManager.ts:40

The VSCode extension context for accessing storage locations.

## Methods

### getAudioCache()

> **getAudioCache**(`key`): `Promise`\<`Buffer`\>

Defined in: storageManager.ts:49

Retrieves audio data from the cache by key.

#### Parameters

##### key

`string`

The cache key for the audio data.

#### Returns

`Promise`\<`Buffer`\>

The cached audio data, or undefined if not found.

***

### readTextFile()

> **readTextFile**(`uri`): `Promise`\<`string`\>

Defined in: storageManager.ts:76

Reads a text file from the given URI.

#### Parameters

##### uri

`Uri`

The URI of the file to read.

#### Returns

`Promise`\<`string`\>

The file contents as a string.

***

### saveAudioFile()

> **saveAudioFile**(`data`, `fileName`, `format`): `Promise`\<`Uri`\>

Defined in: storageManager.ts:88

Saves an audio file to a user-specified location.

#### Parameters

##### data

`Buffer`

The audio data to save.

##### fileName

`string`

The name of the file to save.

##### format

The audio format (mp3 or wav).

`"mp3"` | `"wav"`

#### Returns

`Promise`\<`Uri`\>

The URI of the saved file, or undefined if not saved.

***

### setAudioCache()

> **setAudioCache**(`key`, `data`): `Promise`\<`void`\>

Defined in: storageManager.ts:147

Caches audio data for later retrieval.

#### Parameters

##### key

`string`

The cache key to associate with the audio data.

##### data

`Buffer`

The audio data to cache.

#### Returns

`Promise`\<`void`\>

***

### enforceCacheLimit()

> `private` **enforceCacheLimit**(): `Promise`\<`void`\>

Defined in: storageManager.ts:190

Enforces the cache size limit using LRU eviction strategy.

#### Returns

`Promise`\<`void`\>

***

### initializeCache()

> `private` **initializeCache**(): `Promise`\<`void`\>

Defined in: storageManager.ts:228

Initializes the cache by loading metadata from disk.

#### Returns

`Promise`\<`void`\>

***

### saveCacheMetadata()

> `private` **saveCacheMetadata**(): `Promise`\<`void`\>

Defined in: storageManager.ts:259

Saves cache metadata to disk.

#### Returns

`Promise`\<`void`\>
