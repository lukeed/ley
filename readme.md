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
  - [x] [`mysql`]()
  - [x] [`mysql2`]()
  - [x] [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3)
  - [ ] [`sqlite`](https://www.npmjs.com/package/sqlite)
- [ ] complete test coverage
- [ ] complete documentation

## Features

* **Agnostic**<br>
  _Supports [`postgres`](https://www.npmjs.com/package/postgres), [`pg`](https://www.npmjs.com/package/pg), [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3), [`sqlite`](https://www.npmjs.com/package/sqlite), [`mysql`](https://www.npmjs.com/package/mysql), and [`mysql2`](https://www.npmjs.com/package/mysql2)_

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

## API

### ley.up(opts?)
Returns: `Promise<string[]>`

Returns a list of the _relative filenames_ (eg, `000-users.js`) that were successfully applied.

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
['postgres', 'pg']; // TODO: more
```

#### opts.config
Type: `object`<br>
Default: `undefined`

A configuration object for your client driver to establish a connection.<br>
When unspecified, `ley` assumes that your client driver is able to connect through `process.env` variables.

>**Note:** The `ley` CLI will search for a `ley.config.js` config file (configurable).<br>
If found, this file may contain an object or a function that resolves to your config object.

#### opts.single
Type: `boolean`<br>
Default: `false`

Enable to apply **only one** migration file's `up` task.<br>
By default, all migration files will be queue for application.



### ley.down(opts?)
Returns: `Promise<string[]>`

Returns a list of the _relative filenames_ (eg, `000-users.js`) that were successfully applied.

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
['postgres', 'pg']; // TODO: more
```

#### opts.all
Type: `boolean`<br>
Default: `false`

Enable to apply **all** migration files' `down` task.<br>
By default, only the most recently-applied migration file is invoked.


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

#### opts.cwd
Type: `string`<br>
Default: `.`

A target location to treat as the current working directory.

> **Note:** This value is `path.resolve()`d from the current `process.cwd()` location.

#### opts.dir
Type: `string`<br>
Default: `migrations`

The directory (relative to `opts.cwd`) to find migration files.


## License

MIT © [Luke Edwards](https://lukeed.com)
