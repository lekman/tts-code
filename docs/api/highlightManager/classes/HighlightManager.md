[**SecNord GRC Service + API v0.0.1**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [highlightManager](../README.md) / HighlightManager

# Class: HighlightManager

Defined in: highlightManager.ts:25

Handles text highlighting and synchronization for the TTS extension.

## Constructors

### Constructor

> **new HighlightManager**(): `HighlightManager`

Defined in: highlightManager.ts:29

Initializes a new instance of the HighlightManager.

#### Returns

`HighlightManager`

## Methods

### clearHighlights()

> **clearHighlights**(`_editor`): `void`

Defined in: highlightManager.ts:38

Clears all highlights in the provided text editor.

#### Parameters

##### \_editor

`TextEditor`

The VSCode text editor instance.

#### Returns

`void`

***

### highlightRange()

> **highlightRange**(`_editor`, `_range`): `void`

Defined in: highlightManager.ts:48

Highlights a specific range in the provided text editor.

#### Parameters

##### \_editor

`TextEditor`

The VSCode text editor instance.

##### \_range

`Range`

The range of text to highlight.

#### Returns

`void`
