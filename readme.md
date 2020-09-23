<div align="center">
  <img src="shots/logo.png" alt="ley" height="200" />
</div>

<div align="center">
  <a href="https://npmjs.org/package/ley">
    <img src="https://badgen.net/npm/v/ley" alt="version" />
  </a>
  <a href="https://github.com/lukeed/ley/actions">
    <img src="https://github.com/lukeed/ley/workflows/CI/badge.svg" alt="CI" />
  </a>
  <a href="https://npmjs.org/package/ley">
    <img src="https://badgen.net/npm/dm/ley" alt="downloads" />
  </a>
</div>

<div align="center">Driver agnostic database migrations</div>

## TODO

> **WIP:** What's here is the end of Night #1

- [ ] driver support:
  - [x] [`pg`](https://www.npmjs.com/package/pg)
  - [x] [`postgres`](https://www.npmjs.com/package/postgres)
  - [x] [`mysql`](https://www.npmjs.com/package/mysql)
  - [x] [`mysql2`](https://www.npmjs.com/package/mysql2)
  - [x] [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3)
  - [ ] [`sqlite`](https://www.npmjs.com/package/sqlite)
- [ ] complete test coverage
- [ ] complete documentation

## Features

* **Agnostic**<br>
  _Supports [`postgres`](https://www.npmjs.com/package/postgres), [`pg`](https://www.npmjs.com/package/pg), [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3), [`sqlite`](https://www.npmjs.com/package/sqlite), [`mysql`](https://www.npmjs.com/package/mysql), [`mysql2`](https://www.npmjs.com/package/mysql2), and [custom drivers!](#drivers)_

* **Lightweight**<br>
  _Does **not** include any driver dependencies._

* **Transactional**<br>
  _Runs all migration files within a transaction for rollback safety._

* **Familiar**<br>
  _Does **not** invent new syntax or abstractions.<br>You're always working directly with your driver of choice._

* **Flexible**<br>
  _Find the CLI to restrictive? You may require `ley` for your own scripting!_


## Install

```
$ npm install --save-dev ley
```


## Usage

> Both [Programmatic](#programmatic) and [CLI](#cli) usages are supported.

### Setup

You must have a `migrations` directory created, preferably in your project's root.

> **Note:** You may configure the target directory and location.

Your filenames within this directory determine _the order of their execution._<br>
Because of this, it's often recommended to prefix migrations with a timestamp or numerical sequence.

***Numerical Sequence***

```
/migrations
  |-- 000-users.js
  |-- 001-teams.js
  |-- 002-seats.js
```

> **Note**: You may create the next file via `ley new todos --length 3` where `todos` is a meaningful name.<br>The above command will create the `migrations/003-todos.js` filepath.

***Timestamped***

```
/migrations
  |-- 1581323445-users.js
  |-- 1581323453-teams.js
  |-- 1581323458-seats.js
```

> **Note**: You may create the next file via `ley new todos --timestamp` where `todos` is a meaningful name.<br>The above command will create the `migrations/1584389617-todos.js` filepath...or similar.


**The order of your migrations is critically important!**<br>Migrations must be treated as an append-only immutable task chain. Without this, there's no way to _reliably_ rollback or recreate your database.

> **Example:** (Above) You cannot apply/create `001-teams.js` _after_ `002-seats.js` has already been applied.<br>Doing so would force your teammates or database replicas to recreate "the world" in the wrong sequence.<br>This may not _always_ pose a problem (eg, unrelated tasks) but it **often does** and so `ley` enforces this practice.

Lastly, each migration file must have an `up` and a `down` task.<br>
These must be exported functions &mdash; `async` okay! &mdash; and will receive your pre-installed client driver as its only argument:

```js
exports.up = async function (DB) {
  // with `pg` :: DB === pg.Client
  await DB.query(`select * from users`);

  // with `postgres` :: DB === sql``
  await DB`select * from users`;
}

exports.down = async function (DB) {
  // My pre-configured "undo" function
}
```

### CLI

  1) Add `ley` as one of your `package.json` scripts; `"migrate"`, for example:

      ```js
      // package.json
      {
        "scripts": {
          "migrate": "ley"
        }
      }
      ```

  2) Invoke `ley up` to apply new migrations, or `ley down` to rollback previous migrations.

      ```sh
      $ npm run migrate up
      $ yarn migrate up
      ```

      <img width="300" src="shots/up1.png" alt="ley up screenshot #1"><br>
      <img width="300" src="shots/up2.png" alt="ley up screenshot #2"><br>
      <img width="300" src="shots/up3.png" alt="ley up screenshot #3"><br>

### Programmatic

> **Note:** See [API](#api) for documentation

With programmatic/scripting usage, you will not inherit any of `ley`'s CLI tooling, which includes all colors and error formatting. Instead, you must manually catch & handle all thrown Errors.

```js
const ley = require('ley');

const successes = await ley.up({ ... });
```

## Config

> **TL;DR:** The contents of a `ley.config.js` file (default file name) is irrelevant to `ley` itself!

A config file is entirely optional since `ley` assumes that you're providing the correct environment variable(s) for your client driver. However, that may not always be possible. In those instances, a `ley.config.js` file (default file name) can be used to adjust your [driver](#drivers)'s `connect` method.

## Drivers

Out of the box, `ley` includes drivers for the following npm packages:

* [`pg`](https://www.npmjs.com/package/pg)
* [`postgres`](https://www.npmjs.com/package/postgres)
* [`mysql`](https://www.npmjs.com/package/mysql)
* [`mysql2`](https://www.npmjs.com/package/mysql2)
* [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3)

Should you need a driver that's not listed above – or to override a supplied driver – you may easily do via a number of avenues:

1) CLI users can add `--driver <name>` to any command; or
2) Programmatic users can pass [`opts.driver`](#optsdriver) to any command; or
3) A `ley.config.js` file can export a special `driver` config key.

With the latter two options, if `driver` is a string then it will be passed through `require()` automatically. Otherwise it is assumed to be a [`Driver`]() class and is validated as such.

> **Important:** All drivers must adhere to the [`Driver` interface](#TODO)!

Whenever a custom Driver is supplied (no matter the avenue), `ley` will ignore `opts.client`, `--client`, and/or skip its auto-detection.

## API

> **Important:** See [Options](#options) for common options shared all commands. <br>In this `API` section, you will only find **command-specific** options listed.


### ley.up(opts?)
Returns: `Promise<string[]>`

Returns a list of the _relative filenames_ (eg, `000-users.js`) that were successfully applied.

#### opts.single
Type: `boolean`<br>
Default: `false`

Enable to apply **only one** migration file's `up` task.<br>
By default, all migration files will be queue for application.



### ley.down(opts?)
Returns: `Promise<string[]>`

Returns a list of the _relative filenames_ (eg, `000-users.js`) that were successfully applied.

#### opts.all
Type: `boolean`<br>
Default: `false`

Enable to apply **all** migration files' `down` task.<br>
By default, only the most recently-applied migration file is invoked.


### ley.status(opts?)
Returns: `Promise<string[]>`

Returns a list of the _relative filenames_ (eg, `000-users.js`) that have not yet been applied.


### ley.new(opts?)
Returns: `Promise<string>`

Returns the newly created _relative filename_ (eg, `000-users.js`).

#### opts.filename
Type: `string`

**Required.** The name of the file to be created.

> **Note:** A prefix will be prepended based on [`opts.timestamp`](#optstimestamp) and [`opts.length`](#optslength) values.<br>The `.js` extension will be applied unless your input already has an extension.

#### opts.timestamp
Type: `boolean`<br>
Default: `false`

Should the migration file have a timestamped prefix?<br>
If so, will use `Date.now()` floored to the nearest second.

#### opts.length
Type: `number`<br>
Default: `5`

When **not** using a timestamped prefix, this value controls the prefix total length.<br>
For example, `00000-users.js` will be followed by `00001-teams.js`.


## Options

> **Note:** These are available to _all_ `ley` commands. <br>_See [API](#api) for programmatic command documentation._

#### opts.cwd
Type: `string`<br>
Default: `.`

A target location to treat as the current working directory.

> **Note:** This value is `path.resolve()`d from the current `process.cwd()` location.

#### opts.dir
Type: `string`<br>
Default: `migrations`

The directory (relative to `opts.cwd`) to find migration files.

#### opts.client
Type: `string`<br>
Default: `undefined`

The **name** of your desired client driver; for example, `pg`.<br>
When unspecified, `ley` searches for all supported client drivers in this order:

```js
['postgres', 'pg', 'mysql', 'mysql2', 'better-sqlite3']
```

#### opts.driver
Type: `string` or `Driver`
Default: `undefined`

When a `string`, this is the **name** of your custom [driver](#drivers) implementation. It will pass through `require()` as written.

Otherwise it's expected to match a [`Driver` interface](#TODO) and will be validated immediately.

> **Important:** When defined, `ley` ignores [`opts.client`](#optsclient) and/or skips client auto-detection entirely!

#### opts.config
Type: `object`<br>
Default: `undefined`

A configuration object for your client driver to establish a connection.<br>
When unspecified, `ley` assumes that your client driver is able to connect through `process.env` variables.

> **Note:** The `ley` CLI will search for a `ley.config.js` config file (configurable). <br>
If found, this file may contain an object or a function that resolves to _anything_ of your chosing. <br>
Please see [Config](#config) for more information.

#### opts.require
Type: `string` or `string[]`<br>
Default: `undefined`

A module name (or list of names) to be `require`d by `ley` at startup.

For example, you may want to use [`dotenv`](http://npmjs.com/package/dotenv) to load existing `.env` file(s) in your project:

```js
const ley = require('ley');

const files = await ley.status({
  require: ['dotenv/config']
});
```

Through [CLI](#cli) usage, this is equivalent to:

```sh
$ ley -r dotenv/config status
# or
$ ley --require dotenv/config status
```


## License

MIT © [Luke Edwards](https://lukeed.com)
