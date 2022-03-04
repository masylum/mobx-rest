import {
  ObservableMap,
  action,
  computed,
  observable,
  makeObservable,
} from 'mobx'
import fromEntries from 'object.fromentries'
import includes from 'lodash/includes'
import isEqual from 'lodash/isEqual'
import isPlainObject from 'lodash/isPlainObject'
import union from 'lodash/union'
import uniqueId from 'lodash/uniqueId'
import isObject from 'lodash/isObject'
import deepmerge from 'deepmerge'
import Collection from './Collection'
import apiClient from './apiClient'
import {
  OptimisticId,
  Id,
  DestroyOptions,
  SaveOptions,
  RestVerbs,
} from './types'

const dontMergeArrays = (_oldArray: Array<any>, newArray: Array<any>) =>
  newArray

type Attributes = Record<string, any>
export const DEFAULT_PRIMARY = 'id'

export default class Model {
  defaultAttributes: Attributes = {}

  attributes: ObservableMap
  committedAttributes: ObservableMap

  optimisticId: OptimisticId = uniqueId('i_')
  collection: Collection<this> | null | undefined = null

  constructor(attributes: Attributes = {}, defaultAttributes: Attributes = {}) {
    makeObservable(this, {
      isNew: computed,
      changedAttributes: computed,
      changes: computed,
      commitChanges: action,
      discardChanges: action,
      reset: action,
      set: action,
      fetch: action,
      save: action,
      destroy: action,
    })

    this.defaultAttributes = defaultAttributes

    const mergedAttributes = {
      ...this.defaultAttributes,
      ...attributes,
    }

    this.attributes = observable.map(mergedAttributes)
    this.committedAttributes = observable.map(mergedAttributes)
  }

  /**
   * Returns a JSON representation
   * of the model
   */
  toJS() {
    return fromEntries(this.attributes)
  }

  /**
   * Define which is the primary
   * key of the model.
   *
   * @abstract
   */
  get primaryKey(): string {
    return DEFAULT_PRIMARY
  }

  /**
   * Return the base url used in
   * the `url` method
   *
   * @abstract
   */
  urlRoot(): string | null {
    return null
  }

  /**
   * Return the url for this given REST resource
   */
  url(): string {
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
  get isNew(): boolean {
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
  get(attribute: string): any {
    if (this.has(attribute)) {
      return this.attributes.get(attribute)
    }
    throw new Error(`Attribute "${attribute}" not found`)
  }

  /**
   * Returns whether the given field exists
   * for the model.
   */
  has(attribute: string): boolean {
    return this.attributes.has(attribute)
  }

  /**
   * Get an id from the model. It will use either
   * the backend assigned one or the client.
   */
  get id(): Id {
    return this.has(this.primaryKey)
      ? this.get(this.primaryKey)
      : this.optimisticId
  }

  /**
   * Get an array with the attributes names that have changed.
   */
  get changedAttributes(): string[] {
    return getChangedAttributesBetween(
      fromEntries(this.committedAttributes),
      this.toJS()
    )
  }

  /**
   * Gets the current changes.
   */
  get changes(): Record<string, any> {
    return getChangesBetween(fromEntries(this.committedAttributes), this.toJS())
  }

  /**
   * If an attribute is specified, returns true if it has changes.
   * If no attribute is specified, returns true if any attribute has changes.
   */
  hasChanges(attribute?: string): boolean {
    if (attribute) {
      return includes(this.changedAttributes, attribute)
    }

    return this.changedAttributes.length > 0
  }

  commitChanges(): void {
    this.committedAttributes.replace(this.toJS())
  }

  discardChanges(): void {
    this.attributes.replace(fromEntries(this.committedAttributes))
  }

  /**
   * Replace all attributes with new data
   */
  reset(data?: {}): void {
    this.attributes.replace(
      data ? { ...this.defaultAttributes, ...data } : this.defaultAttributes
    )
  }

  /**
   * Merge the given attributes with
   * the current ones
   */
  set(data: {}): void {
    this.attributes.merge(data)
  }

  /**
   * Fetches the model from the backend.
   */
  async fetch<R = unknown>({ data, ...otherOptions }: { data?: {} } = {}) {
    const newData = await apiClient().get<R>(this.url(), data, otherOptions)

    if (!newData) return

    action('fetch done', () => {
      this.set(newData)
      this.commitChanges()
    })()

    return newData
  }

  /**
   * Saves the resource on the backend.
   *
   * If the item has a `primaryKey` it updates it,
   * otherwise it creates the new resource.
   *
   * It supports optimistic and patch updates.
   */
  async save<R = unknown>(
    attributes?: {},
    {
      optimistic = true,
      patch = true,
      keepChanges = false,
      path,
      ...otherOptions
    }: SaveOptions = {}
  ) {
    const currentAttributes = this.toJS()
    const collection = this.collection
    let data: {}

    if (patch && attributes && !this.isNew) {
      data = attributes
    } else if (patch && !this.isNew) {
      data = this.changes
    } else {
      data = { ...currentAttributes, ...attributes }
    }

    let method: RestVerbs

    if (this.isNew) {
      method = 'post'
    } else if (patch) {
      method = 'patch'
    } else {
      method = 'put'
    }

    if (optimistic && attributes) {
      this.set(
        patch ? applyPatchChanges(currentAttributes, attributes) : attributes
      )
    }

    if (optimistic && collection) collection.add([this])

    try {
      const newData = await apiClient()[method]<R>(
        path || this.url(),
        data,
        otherOptions
      )
      if (!newData) return

      const changes = getChangesBetween(currentAttributes, this.toJS())

      action('save success', () => {
        this.set(newData)
        this.commitChanges()

        if (!optimistic && collection) collection.add([this])

        if (keepChanges) {
          this.set(applyPatchChanges(newData, changes))
        }
      })()

      return newData
    } catch (error) {
      action('save error', () => {
        this.set(currentAttributes)

        if (optimistic && this.isNew && collection) {
          collection.remove(this)
        }
      })()

      throw error
    }
  }

  /**
   * Destroys the resource on the client and
   * requests the backend to delete it there
   * too
   */
  async destroy<R = unknown>({
    data,
    optimistic = true,
    path,
    ...otherOptions
  }: DestroyOptions = {}) {
    const collection = this.collection

    if (this.isNew && collection) {
      collection.remove(this)
      return
    }
    if (this.isNew) return

    // It is important to compute the url before removing it if
    // the url depends on the collection url.
    const url = path || this.url()

    if (optimistic && collection) {
      collection.remove(this)
    }

    try {
      const newData = await apiClient().del<R>(url, data, otherOptions)
      if (!optimistic && collection) collection.remove(this)

      return newData
    } catch (error) {
      if (optimistic && collection) collection.add(this)
      throw error
    }
  }

  /**
   * Call an RPC action for all those
   * non-REST endpoints that you may have in
   * your API.
   */
  rpc<R = unknown>(endpoint: string | { rootUrl: string }, options?: {}) {
    const url = isObject(endpoint)
      ? endpoint.rootUrl
      : `${this.url()}/${endpoint}`

    return apiClient().post<R>(url, options)
  }
}

/**
 * Merges old attributes with new ones.
 * By default it doesn't merge arrays.
 */
const applyPatchChanges = (oldAttributes: {}, changes: {}): {} => {
  return deepmerge(oldAttributes, changes, {
    arrayMerge: dontMergeArrays,
  })
}

const getChangedAttributesBetween = (
  source: Record<string, any>,
  target: Record<string, any>
): string[] => {
  const keys = union(Object.keys(source), Object.keys(target))

  return keys.filter((key) => !isEqual(source[key], target[key]))
}

const getChangesBetween = (
  source: Record<string, any>,
  target: Record<string, any>
): Record<string, any> => {
  const changes: Record<string, any> = {}

  getChangedAttributesBetween(source, target).forEach((key) => {
    changes[key] =
      isPlainObject(source[key]) && isPlainObject(target[key])
        ? getChangesBetween(source[key], target[key])
        : target[key]
  })

  return changes
}
