# ley

> Driver agnostic database migrations

## TODO

> **WIP:** What's here is the end of Night #1

- [ ] driver support:
  - [x] [`pg`](https://www.npmjs.com/package/pg)
  - [x] [`postgres`](https://www.npmjs.com/package/postgres)
  - [ ] [`mysql`]()
  - [ ] [`mysql2`]()
- [ ] complete test coverage
- [ ] complete documentation

## Features

* **Agnostic**<br>
  _Supports [`postgres`](https://www.npmjs.com/package/postgres), [`pg`](https://www.npmjs.com/package/pg), [`mysql`](https://www.npmjs.com/package/mysql), and [`mysql2`](https://www.npmjs.com/package/mysql2)._

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

***Timestamped***

```
/migrations
  |-- 1581323445664-users.js
  |-- 1581323453868-teams.js
  |-- 1581323458383-seats.js
```

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


## License

MIT © [Luke Edwards](https://lukeed.com)
