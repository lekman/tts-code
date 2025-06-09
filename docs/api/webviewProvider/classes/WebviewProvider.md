[**SecNord GRC Service + API v1.0.0**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [webviewProvider](../README.md) / WebviewProvider

# Class: WebviewProvider

Defined in: webviewProvider.ts:39

Provides a webview panel for playback controls and TTS UI in the extension.

## Implements

- `WebviewViewProvider`

## Constructors

### Constructor

> **new WebviewProvider**(`_context`, `audioManager`, `highlightManager`): `WebviewProvider`

Defined in: webviewProvider.ts:59

Creates a new WebviewProvider instance.

#### Parameters

##### \_context

`ExtensionContext`

The VSCode extension context for resource management.

##### audioManager

[`AudioManager`](../../audioManager/classes/AudioManager.md)

The audio manager instance for audio operations.

##### highlightManager

[`HighlightManager`](../../highlightManager/classes/HighlightManager.md)

The highlight manager instance for text highlighting.

#### Returns

`WebviewProvider`

## Properties

### viewType

> `readonly` `static` **viewType**: `"ttsCode.webview"` = `"ttsCode.webview"`

Defined in: webviewProvider.ts:43

The unique view type identifier for the webview.

***

### \_onDidReceiveMessage

> `private` **\_onDidReceiveMessage**: `EventEmitter`\<[`WebviewMessage`](../interfaces/WebviewMessage.md)\>

Defined in: webviewProvider.ts:45

***

### onDidReceiveMessage

> `readonly` **onDidReceiveMessage**: `Event`\<[`WebviewMessage`](../interfaces/WebviewMessage.md)\>

Defined in: webviewProvider.ts:49

Event that fires when the webview sends a message

***

### \_view?

> `private` `optional` **\_view**: `WebviewView`

Defined in: webviewProvider.ts:51

***

### \_context

> `private` `readonly` **\_context**: `ExtensionContext`

Defined in: webviewProvider.ts:60

The VSCode extension context for resource management.

***

### audioManager

> `private` `readonly` **audioManager**: [`AudioManager`](../../audioManager/classes/AudioManager.md)

Defined in: webviewProvider.ts:61

The audio manager instance for audio operations.

***

### highlightManager

> `private` `readonly` **highlightManager**: [`HighlightManager`](../../highlightManager/classes/HighlightManager.md)

Defined in: webviewProvider.ts:62

The highlight manager instance for text highlighting.

## Methods

### dispose()

> **dispose**(): `void`

Defined in: webviewProvider.ts:69

Disposes of the webview provider and cleans up resources.

#### Returns

`void`

***

### postMessage()

> **postMessage**(`message`): `void`

Defined in: webviewProvider.ts:79

Posts a message to the webview.

#### Parameters

##### message

[`WebviewMessage`](../interfaces/WebviewMessage.md)

The message to send.

#### Returns

`void`

***

### resolveWebviewView()

> **resolveWebviewView**(`webviewView`, `_context`, `_token`): `void`

Defined in: webviewProvider.ts:92

Resolves and displays the webview view with playback controls UI.

#### Parameters

##### webviewView

`WebviewView`

The webview view instance to populate.

##### \_context

`WebviewViewResolveContext`

The resolve context for the webview view.

##### \_token

`CancellationToken`

Cancellation token for the resolve operation.

#### Returns

`void`

#### Implementation of

`vscode.WebviewViewProvider.resolveWebviewView`

***

### getHtmlForWebview()

> `private` **getHtmlForWebview**(`webview`): `string`

Defined in: webviewProvider.ts:121

Returns the HTML content for the playback controls webview.

#### Parameters

##### webview

`Webview`

The webview instance.

#### Returns

`string`

The HTML string for the webview UI.
