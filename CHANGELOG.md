# Changelog

## `2.1.0`

:rocket: New features:

  - Add `isRequest` for models (it was already in `Collection`).
  - Add `primaryKey` so you can use a different key than `'id'`.

:wrench: Tooling:

  - Add `prettier-standard`
  - Add flow linting
  - Set test coverage

## `2.1.1`

:bug: Fixes:

  - Removed need for a runtime by using babel's `transform-async-to-generator`
