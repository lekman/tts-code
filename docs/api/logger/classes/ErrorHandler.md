[**SecNord GRC Service + API v1.3.2**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [logger](../README.md) / ErrorHandler

# Class: ErrorHandler

Defined in: logger.ts:125

Error handler utility class for consistent error handling

## Constructors

### Constructor

> **new ErrorHandler**(): `ErrorHandler`

#### Returns

`ErrorHandler`

## Methods

### getUserFriendlyMessage()

> `static` **getUserFriendlyMessage**(`error`): `string`

Defined in: logger.ts:131

Create a user-friendly error message from an error object

#### Parameters

##### error

`unknown`

The error object

#### Returns

`string`

A user-friendly error message

***

### handleError()

> `static` **handleError**(`error`, `userMessage`, `showNotification?`): `unknown`

Defined in: logger.ts:162

Handle an error with logging and optional user notification

#### Parameters

##### error

`unknown`

The error to handle

##### userMessage

`string`

User-friendly error message

##### showNotification?

`boolean` = `true`

Whether to show a notification to the user

#### Returns

`unknown`

The original error

***

### withErrorHandling()

> `static` **withErrorHandling**\<`T`\>(`operation`, `errorMessage`, `showNotification?`): `Promise`\<`T`\>

Defined in: logger.ts:197

Wrap an async operation with error handling

#### Type Parameters

##### T

`T`

#### Parameters

##### operation

() => `Promise`\<`T`\>

The async operation to execute

##### errorMessage

`string`

Error message to show if operation fails

##### showNotification?

`boolean` = `true`

Whether to show a notification on error

#### Returns

`Promise`\<`T`\>

The result of the operation or undefined on error
