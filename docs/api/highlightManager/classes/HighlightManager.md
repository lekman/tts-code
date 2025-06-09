[**SecNord GRC Service + API v0.0.1**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [highlightManager](../README.md) / HighlightManager

# Class: HighlightManager

Defined in: highlightManager.ts:24

Handles text highlighting and synchronization for the TTS extension.

## Constructors

### Constructor

> **new HighlightManager**(): `HighlightManager`

Defined in: highlightManager.ts:32

Initializes a new instance of the HighlightManager.

#### Returns

`HighlightManager`

## Properties

### currentDecorations

> `private` **currentDecorations**: `DecorationOptions`[] = `[]`

Defined in: highlightManager.ts:25

***

### currentEditor?

> `private` `optional` **currentEditor**: `TextEditor`

Defined in: highlightManager.ts:26

***

### decorationType

> `private` **decorationType**: `TextEditorDecorationType`

Defined in: highlightManager.ts:27

## Methods

### clearHighlights()

> **clearHighlights**(): `void`

Defined in: highlightManager.ts:44

Clears all highlights in the current text editor.

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: highlightManager.ts:55

Disposes of the highlight manager and cleans up resources.

#### Returns

`void`

***

### highlightRange()

> **highlightRange**(`range`): `void`

Defined in: highlightManager.ts:67

Highlights a specific range in the current text editor.

#### Parameters

##### range

`Range`

The range of text to highlight.

#### Returns

`void`

***

### setActiveEditor()

> **setActiveEditor**(`editor`): `void`

Defined in: highlightManager.ts:90

Sets the active text editor for highlighting.

#### Parameters

##### editor

`TextEditor`

The VSCode text editor instance.

#### Returns

`void`
