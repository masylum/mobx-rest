# Changelog

## `7.1.0``

  - Added `Collection#last` method

## `7.0.1``

  - One more performance improvement by optimizing `Collection#constructor` to just reset the collection

## `7.0.0``

  - Breaking: Moved indexes as getters so they are available during the first `Collection#set` call in the constructor
  - Refactored `Collection#set` to batch all the additions so indexes are not recalculated for each addition.
  - Refactored `Model#constructor` to directly set the attributes instead of initialize with an empty map and replace it.

## `6.0.1``

  - Fix peformance regression for `set` introduced in 4.0.0 with the addition of indexes: We were creating a model just to call the `primaryKey` method instead of just calling the prototype.

## `6.0.0``
  - Remove mustFind and mustGet methods

## `5.0.7`

  - Improved error messages when an invariant fails.

## `5.0.6`

  - Defend some cases when data is not present.


## `5.0.5`

  - Avoids `add` adding duplicated records and switches `model.save` to use add instead of `set`

## `5.0.3`

  - Fixes another edge case when passing a model to `collection.set`

## `5.0.2`

  - Fixes edge case when a request fails and no collection was given

## `5.0.1`

  - Fixes edge case where a model without `id` would make `collection.set` fail.

## `5.0.0`

  - Made `set` accept models too, not only attributes.
  - Now, `save` will add the model to the collection if one is assigned. This allows people to use `collection.build + save` effectively.

## `4.0.2`

  - Fixes `filter` throwing errors when targeting non-existing attributes.

## `4.0.1`

  - Allow a default primary key if model didn't return a class

## `4.0.0`

  - Added indexes to optimize filter and find

## `3.0.5`

  - Rollback default `patch` flag value to `true`.

## `3.0.0`

New features 🎩:

  - Reimplemented `mustFind` and `mustGet` methods in Collection.
  - Brought back the `request` attribute in Model. The attribute tracks the last issued request.
  - Brought back `onProgress` hook in `save` method.

Solved bugs 🐛:

  - Fix https://github.com/masylum/mobx-rest/issues/47
  - Fix https://github.com/masylum/mobx-rest/issues/41

What's changed 💅:

  - Migrated to Typescript
  - Made RPC label optional with a default `fetching` value

Breaking changes ☢️:

  - Migrated to Mobx 5+
  - Rollback default `keepChanges` flag value to `false`.
  - Compatible adapters need to implement `data` as their second argument [as such](https://github.com/masylum/mobx-rest-jquery-adapter/commit/1e55c15dc37d372db1ae4345dedef855b8fb7611#diff-1fdf421c05c1140f6d71444ea2b27638R135).

## `3.0.0.alpha`

:sparkles:

Full description here: https://github.com/masylum/mobx-rest/pull/39
Kudos to @rdiazv

## `2.2.5`

:nail_care:

  - Remove flow-typed
  - Improve bundle size with babel-lodash (kudos @ryedin)

## `2.2.4`

:tophat:

  - Fixed `reset` on models. Use mobx `replace`

## `2.2.3`

:tophat:

  - Added `reset` to models.

## `2.2.2`

:tophat:

  - Added `length` for conveniently checking the length of the collection

## `2.2.1`

:tophat:

  - Added `reset` for conveniently resetting a whole collection

## `2.2.0`

:nail_care:

  - Defined `mobx` as a `peerDependency`

## `2.1.9`

:bug:

  - Fixed: Nested attributes couldn't be saved. (kudos to @rdiazv)

## `2.1.8`

:bug:

  - Fixed: Creating a new model didn't merge the attribute in some cases. (kudos to @rdiazv)

## `2.1.7`

:tophat:

  - Added `mustGet` and `mustFind` as whinny versions of `get` and `find`

## `2.1.6`

:nail_care:

  - Added flow types in the build process
  - Updated dependencies

## `2.1.5`

:nail_care:

  - Improved error handling (kudos to @p3drosola)

## `2.1.4`

:bug: Bugfix:

  - Stop publishing `babelrc` since it breaks React native

## `2.1.3`

:bug: Bugfix:

  - Fix models not being observable after `add`

## `2.1.2`

:bug: Fixes:

  - Added `transform-runtime`

## `2.1.1`

:bug: Fixes:

  - Removed need for a runtime by using babel's `transform-async-to-generator`

## `2.1.0`

:rocket: New features:

  - Add `isRequest` for models (it was already in `Collection`).
  - Add `primaryKey` so you can use a different key than `'id'`.

:wrench: Tooling:

  - Add `prettier-standard`
  - Add flow linting
  - Set test coverage
