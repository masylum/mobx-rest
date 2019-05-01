// @flow
import {
  observable,
  action,
  ObservableMap,
  computed,
  toJS,
  runInAction
} from 'mobx'
import { uniqueId, union, isEqual, isPlainObject } from 'lodash'
import deepmerge from 'deepmerge'
import Collection from './Collection'
import apiClient from './apiClient'
import Base from './Base'
import Request from './Request'
import type {
  OptimisticId,
  Id,
  DestroyOptions,
  SaveOptions
} from './types'

const dontMergeArrays = (_oldArray, newArray) => newArray

export default class Model extends Base {
  static defaultAttributes = {}

  attributes: ObservableMap = observable.map()
  committedAttributes: ObservableMap = observable.map()

  optimisticId: OptimisticId = uniqueId('i_')
  collection: ?Collection = null

  constructor (attributes: { [key: string]: any } = {}) {
    super()

    const mergedAttributes = {
      ...this.constructor.defaultAttributes,
      ...attributes
    }

    this.attributes.replace(mergedAttributes)
    this.commitChanges()
  }

  /**
   * Returns a JSON representation
   * of the model
   */
  toJS () {
    return toJS(this.attributes)
  }

  /**
   * Determine what attribute do you use
   * as a primary id
   *
   * @abstract
   */
  get primaryKey (): string {
    return 'id'
  }

  /**
   * Return the base url used in
   * the `url` method
   *
   * @abstract
   */
  urlRoot () {
    return null
  }

  /**
   * Return the url for this given REST resource
   */
  url (): string {
    let urlRoot = this.urlRoot()

    if (!urlRoot && this.collection) {
      urlRoot = this.collection.url()
    }

    if (!urlRoot) {
      throw new Error('implement `urlRoot` method or `url` on the collection')
    }

    if (this.isNew) {
      return urlRoot
    } else {
      return `${urlRoot}/${this.get(this.primaryKey)}`
    }
  }

  /**
   * Wether the resource is new or not
   *
   * We determine this asking if it contains
   * the `primaryKey` attribute (set by the server).
   */
  @computed
  get isNew (): boolean {
    return !this.has(this.primaryKey) || !this.get(this.primaryKey)
  }

  /**
   * Get the attribute from the model.
   *
   * Since we want to be sure changes on
   * the schema don't fail silently we
   * throw an error if the field does not
   * exist.
   *
   * If you want to deal with flexible schemas
   * use `has` to check wether the field
   * exists.
   */
  get (attribute: string): any {
    if (this.has(attribute)) {
      return this.attributes.get(attribute)
    }
    throw new Error(`Attribute "${attribute}" not found`)
  }

  /**
   * Returns whether the given field exists
   * for the model.
   */
  has (attribute: string): boolean {
    return this.attributes.has(attribute)
  }

  /**
   * Get an id from the model. It will use either
   * the backend assigned one or the client.
   */
  get id (): Id {
    return this.has(this.primaryKey)
      ? this.get(this.primaryKey)
      : this.optimisticId
  }

  /**
   * Get an array with the attributes names that have changed.
   */
  @computed
  get changedAttributes (): Array<string> {
    return getChangedAttributesBetween(toJS(this.committedAttributes), toJS(this.attributes))
  }

  /**
   * Gets the current changes.
   */
  @computed
  get changes (): { [string]: mixed } {
    return getChangesBetween(toJS(this.committedAttributes), toJS(this.attributes))
  }

  /**
   * If an attribute is specified, returns true if it has changes.
   * If no attribute is specified, returns true if any attribute has changes.
   */
  hasChanges (attribute?: string): boolean {
    if (attribute) {
      return this.changedAttributes.indexOf(attribute) !== -1
    }

    return this.changedAttributes.length > 0
  }

  @action
  commitChanges (): void {
    this.committedAttributes.replace(toJS(this.attributes))
  }

  @action
  discardChanges (): void {
    this.attributes.replace(toJS(this.committedAttributes))
  }

  /**
   * Replace all attributes with new data
   */
  @action
  reset (data?: {}): void {
    this.attributes.replace(
      data
        ? { ...this.constructor.defaultAttributes, ...data }
        : this.constructor.defaultAttributes
    )
  }

  /**
   * Merge the given attributes with
   * the current ones
   */
  @action
  set (data: {}): void {
    this.attributes.merge(data)
  }

  /**
   * Fetches the model from the backend.
   */
  @action
  fetch ({ data, ...otherOptions }: { data?: {} } = {}): Request {
    const { abort, promise } = apiClient().get(this.url(), data, otherOptions)
    const label = 'fetching'

    promise
      .then(data => {
        this.set(data)
        this.commitChanges()

        return data
      })
      .catch(error => {
        runInAction('fetchin error', () => {
          this.error = { label, body: error }
        })

        throw error
      })

    return this.withRequest(label, promise, abort)
  }

  /**
   * Merges old attributes with new ones.
   * By default it doesn't merge arrays.
   */
  applyPatchChanges (oldAttributes: {}, changes: {}): {} {
    return deepmerge(oldAttributes, changes, {
      arrayMerge: dontMergeArrays
    })
  }

  /**
   * Saves the resource on the backend.
   *
   * If the item has a `primaryKey` it updates it,
   * otherwise it creates the new resource.
   *
   * It supports optimistic and patch updates.
   *
   * TODO: Add progress
   */
  @action
  save (
    attributes?: {},
    { optimistic = true, patch = false, keepChanges = true, ...otherOptions }: SaveOptions = {}
  ): Request {
    const currentAttributes = this.toJS()
    const label = this.isNew ? 'creating' : 'updating'
    let data

    if (patch && attributes) {
      data = attributes
    } else if (patch) {
      data = this.changes
    } else {
      data = { ...currentAttributes, ...attributes }
    }

    let method

    if (this.isNew) {
      method = 'post'
    } else if (patch) {
      method = 'patch'
    } else {
      method = 'put'
    }

    if (optimistic && attributes) {
      this.set(patch
        ? this.applyPatchChanges(currentAttributes, attributes)
        : attributes
      )
    }

    const { promise, abort } = apiClient()[method](this.url(), data, otherOptions)

    promise
      .then(data => {
        const changes = getChangesBetween(currentAttributes, toJS(this.attributes))

        runInAction('save success', () => {
          this.set(data)
          this.commitChanges()

          if (keepChanges) {
            this.set(this.applyPatchChanges(data, changes))
          }
        })

        return data
      })
      .catch(error => {
        this.set(currentAttributes)
        throw error
      })

    return this.withRequest(['saving', label], promise, abort)
  }

  /**
   * Destroys the resurce on the client and
   * requests the backend to delete it there
   * too
   */
  @action
  destroy ({ optimistic = true, ...otherOptions }: DestroyOptions = {}): Request {
    const collection = this.collection

    if (this.isNew && collection) {
      collection.remove(this)
      return new Request(Promise.resolve())
    }

    if (this.isNew) {
      return new Request(Promise.resolve())
    }

    const { promise, abort } = apiClient().del(this.url(), otherOptions)

    if (optimistic && collection) {
      collection.remove(this)
    }

    promise
      .then(data => {
        if (!optimistic && collection) {
          collection.remove(this)
        }
        return data
      })
      .catch(error => {
        if (optimistic && collection) {
          collection.add(this)
        }
        throw error
      })

    return this.withRequest('destroying', promise, abort)
  }
}

const getChangedAttributesBetween = (source: {}, target: {}): Array<string> => {
  const keys = union(
    Object.keys(source),
    Object.keys(target)
  )

  return keys.filter(key => !isEqual(source[key], target[key]))
}

const getChangesBetween = (source: {}, target: {}): { [string]: mixed } => {
  const changes = {}

  getChangedAttributesBetween(source, target).forEach(key => {
    changes[key] = isPlainObject(source[key]) && isPlainObject(target[key])
      ? getChangesBetween(source[key], target[key])
      : target[key]
  })

  return changes
}
