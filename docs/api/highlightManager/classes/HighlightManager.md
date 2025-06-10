[**SecNord GRC Service + API v1.3.2**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [highlightManager](../README.md) / HighlightManager

# Class: HighlightManager

Defined in: highlightManager.ts:47

Handles text highlighting and synchronization for the TTS extension.

## Constructors

### Constructor

> **new HighlightManager**(`options?`): `HighlightManager`

Defined in: highlightManager.ts:59

Initializes a new instance of the HighlightManager.

#### Parameters

##### options?

[`HighlightOptions`](../interfaces/HighlightOptions.md)

Optional highlighting configuration

#### Returns

`HighlightManager`

## Properties

### currentDecorations

> `private` **currentDecorations**: `DecorationOptions`[] = `[]`

Defined in: highlightManager.ts:48

***

### currentEditor?

> `private` `optional` **currentEditor**: `TextEditor`

Defined in: highlightManager.ts:49

***

### decorationType

> `private` **decorationType**: `TextEditorDecorationType`

Defined in: highlightManager.ts:50

***

### highlightMode

> `private` **highlightMode**: `"word"` \| `"sentence"` \| `"line"` = `"word"`

Defined in: highlightManager.ts:51

***

### lastHighlightedIndex

> `private` **lastHighlightedIndex**: `number` = `-1`

Defined in: highlightManager.ts:52

***

### wordPositions

> `private` **wordPositions**: `WordPosition`[] = `[]`

Defined in: highlightManager.ts:53

## Methods

### calculatePositionFromTimestamp()

> **calculatePositionFromTimestamp**(`timestamp`, `totalDuration`): `Range`

Defined in: highlightManager.ts:81

Calculates the position in text based on audio timestamp.

#### Parameters

##### timestamp

`number`

The current audio timestamp in seconds.

##### totalDuration

`number`

The total audio duration in seconds.

#### Returns

`Range`

The range to highlight, or undefined if not found.

***

### clearHighlights()

> **clearHighlights**(): `void`

Defined in: highlightManager.ts:115

Clears all highlights in the current text editor.

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: highlightManager.ts:127

Disposes of the highlight manager and cleans up resources.

#### Returns

`void`

***

### getHighlightedText()

> **getHighlightedText**(): `string`

Defined in: highlightManager.ts:140

Gets the current highlighted text.

#### Returns

`string`

The currently highlighted text.

***

### getProgress()

> **getProgress**(): `number`

Defined in: highlightManager.ts:153

Gets the current highlight progress as a percentage.

#### Returns

`number`

Progress from 0 to 1, or -1 if no words.

***

### getWordCount()

> **getWordCount**(): `number`

Defined in: highlightManager.ts:164

Gets the total number of words in the current document.

#### Returns

`number`

The total number of words.

***

### highlightAtTimestamp()

> **highlightAtTimestamp**(`timestamp`, `totalDuration`): `void`

Defined in: highlightManager.ts:174

Highlights text at a specific position based on timestamp.

#### Parameters

##### timestamp

`number`

The current audio timestamp in seconds.

##### totalDuration

`number`

The total audio duration in seconds.

#### Returns

`void`

***

### highlightNextWord()

> **highlightNextWord**(): `boolean`

Defined in: highlightManager.ts:185

Highlights the next word in sequence.

#### Returns

`boolean`

True if a word was highlighted, false if at the end.

***

### highlightPreviousWord()

> **highlightPreviousWord**(): `boolean`

Defined in: highlightManager.ts:205

Highlights the previous word in sequence.

#### Returns

`boolean`

True if a word was highlighted, false if at the beginning.

***

### highlightRange()

> **highlightRange**(`range`): `void`

Defined in: highlightManager.ts:222

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

Defined in: highlightManager.ts:245

Sets the active text editor for highlighting.

#### Parameters

##### editor

`TextEditor`

The VSCode text editor instance.

#### Returns

`void`

***

### setHighlightMode()

> **setHighlightMode**(`mode`): `void`

Defined in: highlightManager.ts:258

Sets the highlighting mode (word, sentence, or line).

#### Parameters

##### mode

The highlighting mode to use.

`"word"` | `"sentence"` | `"line"`

#### Returns

`void`

***

### calculateWordPositions()

> `private` **calculateWordPositions**(): `void`

Defined in: highlightManager.ts:266

Calculates word positions for the current editor's text.

#### Returns

`void`

***

### getLineRange()

> `private` **getLineRange**(`word`): `Range`

Defined in: highlightManager.ts:298

Gets the range for the line containing the given word.

#### Parameters

##### word

`WordPosition`

The word position.

#### Returns

`Range`

The line range.

***

### getRangeForMode()

> `private` **getRangeForMode**(`wordIndex`): `Range`

Defined in: highlightManager.ts:312

Gets the range for highlighting based on the current mode.

#### Parameters

##### wordIndex

`number`

The index of the current word.

#### Returns

`Range`

The range to highlight.

***

### getSentenceRange()

> `private` **getSentenceRange**(`wordIndex`): `Range`

Defined in: highlightManager.ts:331

Gets the range for the sentence containing the word at the given index.

#### Parameters

##### wordIndex

`number`

The index of the current word.

#### Returns

`Range`

The sentence range.
