[**SecNord GRC Service + API v1.3.2**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [apiKeyManager](../README.md) / ApiKeyManager

# Class: ApiKeyManager

Defined in: apiKeyManager.ts:25

Manages the storage, retrieval, and validation of ElevenLabs API keys.
Uses VSCode's SecretStorage API for secure key storage.

## Constructors

### Constructor

> **new ApiKeyManager**(`context`): `ApiKeyManager`

Defined in: apiKeyManager.ts:34

Creates a new ApiKeyManager instance.

#### Parameters

##### context

`ExtensionContext`

The VSCode extension context for accessing SecretStorage.

#### Returns

`ApiKeyManager`

## Properties

### API\_KEY\_SECRET

> `private` `readonly` `static` **API\_KEY\_SECRET**: `"elevenlabs-api-key"` = `"elevenlabs-api-key"`

Defined in: apiKeyManager.ts:26

***

### ELEVENLABS\_API\_URL

> `private` `readonly` `static` **ELEVENLABS\_API\_URL**: `"https://api.elevenlabs.io/v1"` = `"https://api.elevenlabs.io/v1"`

Defined in: apiKeyManager.ts:27

***

### secretStorage

> `private` **secretStorage**: `SecretStorage`

Defined in: apiKeyManager.ts:28

## Methods

### deleteApiKey()

> **deleteApiKey**(): `Promise`\<`void`\>

Defined in: apiKeyManager.ts:42

Deletes the stored API key from secure storage.

#### Returns

`Promise`\<`void`\>

***

### ensureApiKey()

> **ensureApiKey**(): `Promise`\<`string`\>

Defined in: apiKeyManager.ts:50

Ensures an API key is available, prompting the user if necessary.

#### Returns

`Promise`\<`string`\>

The API key if available or entered, undefined otherwise.

***

### getApiKey()

> **getApiKey**(): `Promise`\<`string`\>

Defined in: apiKeyManager.ts:73

Retrieves the stored API key from secure storage.

#### Returns

`Promise`\<`string`\>

The API key if found, undefined otherwise.

***

### promptForApiKey()

> **promptForApiKey**(): `Promise`\<`string`\>

Defined in: apiKeyManager.ts:82

Prompts the user to enter their API key and validates it.
If valid, stores the key in secure storage.

#### Returns

`Promise`\<`string`\>

The validated API key if successful, undefined otherwise.

***

### resetApiKey()

> **resetApiKey**(): `Promise`\<`string`\>

Defined in: apiKeyManager.ts:132

Clears the stored API key and prompts for a new one.

#### Returns

`Promise`\<`string`\>

The new API key if entered, undefined otherwise.

***

### setApiKey()

> **setApiKey**(`apiKey`): `Promise`\<`void`\>

Defined in: apiKeyManager.ts:143

Stores the API key in secure storage.

#### Parameters

##### apiKey

`string`

The API key to store.

#### Returns

`Promise`\<`void`\>

***

### validateApiKey()

> **validateApiKey**(`apiKey`): `Promise`\<`boolean`\>

Defined in: apiKeyManager.ts:152

Validates an API key by making a test request to the ElevenLabs API.

#### Parameters

##### apiKey

`string`

The API key to validate.

#### Returns

`Promise`\<`boolean`\>

True if the API key is valid, false otherwise.
