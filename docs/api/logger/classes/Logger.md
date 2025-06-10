[**SecNord GRC Service + API v1.3.2**](../../README.md)

***

[SecNord GRC Service + API](../../README.md) / [logger](../README.md) / Logger

# Class: Logger

Defined in: logger.ts:34

Logger class for managing extension logging

## Constructors

### Constructor

> **new Logger**(): `Logger`

#### Returns

`Logger`

## Properties

### logLevel

> `private` `static` **logLevel**: [`LogLevel`](../enumerations/LogLevel.md) = `LogLevel.INFO`

Defined in: logger.ts:35

***

### outputChannel

> `private` `static` **outputChannel**: `OutputChannel`

Defined in: logger.ts:36

## Methods

### debug()

> `static` **debug**(`message`): `void`

Defined in: logger.ts:42

Log a debug message

#### Parameters

##### message

`string`

The message to log

#### Returns

`void`

***

### dispose()

> `static` **dispose**(): `void`

Defined in: logger.ts:51

Dispose of the output channel

#### Returns

`void`

***

### error()

> `static` **error**(`message`, `error?`): `void`

Defined in: logger.ts:62

Log an error message

#### Parameters

##### message

`string`

The message to log

##### error?

`Error`

Optional error object to log

#### Returns

`void`

***

### info()

> `static` **info**(`message`): `void`

Defined in: logger.ts:75

Log an info message

#### Parameters

##### message

`string`

The message to log

#### Returns

`void`

***

### initialize()

> `static` **initialize**(): `void`

Defined in: logger.ts:84

Initialize the logger with VS Code output channel

#### Returns

`void`

***

### show()

> `static` **show**(): `void`

Defined in: logger.ts:97

Show the output channel

#### Returns

`void`

***

### warn()

> `static` **warn**(`message`): `void`

Defined in: logger.ts:105

Log a warning message

#### Parameters

##### message

`string`

The message to log

#### Returns

`void`

***

### log()

> `private` `static` **log**(`level`, `message`): `void`

Defined in: logger.ts:116

Internal logging method

#### Parameters

##### level

`string`

The log level

##### message

`string`

The message to log

#### Returns

`void`
