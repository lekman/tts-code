[**SecNord GRC Service + API v0.0.1**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [webviewProvider](../README.md) / WebviewProvider

# Class: WebviewProvider

Defined in: webviewProvider.ts:24

Provides a webview panel for playback controls and TTS UI in the extension.

## Implements

- `WebviewViewProvider`

## Constructors

### Constructor

> **new WebviewProvider**(`_context`): `WebviewProvider`

Defined in: webviewProvider.ts:34

Creates a new WebviewProvider instance.

#### Parameters

##### \_context

`ExtensionContext`

The VSCode extension context for resource management.

#### Returns

`WebviewProvider`

## Properties

### viewType

> `readonly` `static` **viewType**: `"ttsCode.webview"` = `"ttsCode.webview"`

Defined in: webviewProvider.ts:28

The unique view type identifier for the webview.

***

### \_context

> `private` `readonly` **\_context**: `ExtensionContext`

Defined in: webviewProvider.ts:34

The VSCode extension context for resource management.

## Methods

### resolveWebviewView()

> **resolveWebviewView**(`webviewView`, `_context`, `_token`): `void`

Defined in: webviewProvider.ts:43

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

> `private` **getHtmlForWebview**(): `string`

Defined in: webviewProvider.ts:58

Returns the HTML content for the playback controls webview.

#### Returns

`string`

The HTML string for the webview UI.
