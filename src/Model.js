// @flow
import {
  observable,
  action,
  ObservableMap,
  computed,
  toJS
} from 'mobx'
import Collection from './Collection'
import { uniqueId, debounce } from 'lodash'
import apiClient from './apiClient'
import ErrorObject from './ErrorObject'
import Base from './Base'
import type {
  OptimisticId,
  Id,
  DestroyOptions,
  SaveOptions,
  CreateOptions
} from './types'

export default class Model extends Base {
  static defaultAttributes = {}

  @observable error: ?ErrorObject = null

  attributes: ObservableMap
  commitedAttributes: ObservableMap

  optimisticId: OptimisticId = uniqueId('i_')
  collection: ?Collection<*> = null

  constructor (attributes: { [key: string]: any } = {}) {
    super()

    const mergedAttributes = {
      ...this.constructor.defaultAttributes,
      ...attributes
    }

    this.attributes = observable.shallowMap(mergedAttributes)
    this.commitedAttributes = observable.shallowMap(mergedAttributes)
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
    throw new Error('`urlRoot` method not implemented')
  }

  /**
   * Return the url for this given REST resource
   */
  url (): string {
    let urlRoot

    if (this.collection) {
      urlRoot = this.collection.url()
    } else {
      urlRoot = this.urlRoot()
    }

    if (!urlRoot) {
      throw new Error('Either implement `urlRoot` or assign a collection')
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
    return !this.has(this.primaryKey)
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
    const changed = []

    this.commitedAttributes.keys().forEach(key => {
      if (this.commitedAttributes.get(key) !== this.attributes.get(key)) {
        changed.push(key)
      }
    })

    return changed
  }

  /**
   * Gets the current changes.
   */
  @computed
  get changes (): { [string]: mixed } {
    const changes = {}

    this.changedAttributes.forEach(key => {
      changes[key] = this.get(key)
    })

    return changes
  }

  /**
   * If an attribute is specified, returns true if it has changes.
   * If no attribute is specified, returns true if any attribute has changes.
   */
  hasChanges (attribute?: string): bool {
    if (attribute) {
      return this.changedAttributes.indexOf(attribute) !== -1
    }

    return this.changedAttributes.length > 0
  }

  /**
   * Replace all attributes with new data
   */
  @action
  reset (data?: {}): void {
    this.attributes.replace(
      data
        ? { ...this.constructor.defaultAttributes, ...data }
        : this.commitedAttributes
    )
  }

  @action
  clear (): void {
    this.attributes.replace(this.constructor.defaultAttributes)
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
  fetch (options: { data?: {} } = {}): Promise<*> {
    const { abort, promise } = apiClient().get(this.url(), options.data)

    return this.withRequest('fetching', promise, abort)
      .then(data => {
        this.reset(data)
        return data
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
    attributes: {},
    { optimistic = true, patch = true }: SaveOptions = {}
  ): Promise<*> {
    if (!this.has(this.primaryKey)) {
      this.set(Object.assign({}, attributes))
      if (this.collection) {
        return this.collection.create(this, { optimistic })
      } else {
        return this._create(this.toJS(), { optimistic })
      }
    }

    let newAttributes
    let data
    const originalAttributes = this.toJS()

    if (patch) {
      newAttributes = Object.assign({}, originalAttributes, attributes)
      data = Object.assign({}, attributes)
    } else {
      newAttributes = Object.assign({}, attributes)
      data = Object.assign({}, originalAttributes, attributes)
    }

    const { promise, abort } = apiClient().put(this.url(), data)

    if (optimistic) this.set(newAttributes)

    return this.withRequest('updating', promise, abort)
      .then(data => {
        this.set(data)
        return data
      })
      .catch(error => {
        this.set(originalAttributes)
        throw error
      })
  }

  /**
   * Internal method that takes care of creating a model that does
   * not belong to a collection
   */
  _create (
    attributes: {},
    { optimistic = true }: CreateOptions = {}
  ): Promise<*> {
    const onProgress = debounce(function onProgress (progress) {
      if (optimistic && this.request) {
        this.request.progress = progress
      }
    }, 300)

    const { abort, promise } = apiClient().post(this.url(), attributes, {
      onProgress
    })

    return this.withRequest('creating', promise, abort)
      .then(data => {
        this.set(data)
        return data
      })
  }

  /**
   * Destroys the resurce on the client and
   * requests the backend to delete it there
   * too
   */
  @action
  destroy ({ optimistic = true }: DestroyOptions = {}): Promise<*> {
    if (!this.has(this.primaryKey) && this.collection) {
      this.collection.remove([this.optimisticId])
      return Promise.resolve()
    }

    const { promise, abort } = apiClient().del(this.url())

    if (optimistic && this.collection) {
      this.collection.remove([this.id])
    }

    return this.withRequest('destroying', promise, abort)
      .then(data => {
        if (!optimistic && this.collection) {
          this.collection.remove([this.id])
        }
        return data
      })
      .catch(error => {
        if (optimistic && this.collection) {
          this.collection.add([this.attributes.toJS()])
        }
        throw error
      })
  }

  /**
   * Call an RPC action for all those
   * non-REST endpoints that you may have in
   * your API.
   */
  @action
  rpc (method: string, options?: {}): Promise<*> {
    const { promise, abort } = apiClient().post(
      `${this.url()}/${method}`,
      body || {}
    )

    return this.withRequest('updating', promise, abort)
  }
}
