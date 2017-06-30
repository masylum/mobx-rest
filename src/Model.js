// @flow
import {
  observable,
  action,
  ObservableMap,
  computed,
  runInAction,
  toJS
} from 'mobx'
import Collection from './Collection'
import { uniqueId, isString, debounce } from 'lodash'
import apiClient from './apiClient'
import Request from './Request'
import ErrorObject from './ErrorObject'
import type {
  OptimisticId,
  Id,
  Label,
  DestroyOptions,
  SaveOptions,
  CreateOptions
} from './types'

export default class Model {
  @observable request: ?Request = null
  @observable error: ?ErrorObject = null
  attributes: ObservableMap

  optimisticId: OptimisticId = uniqueId('i_')
  collection: ?Collection<*> = null

  constructor (attributes: { [key: string]: any } = {}) {
    this.attributes = observable.map(attributes)
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
    throw new Error('`url` method not implemented')
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
   * Questions whether the request exists
   * and matches a certain label
   */
  isRequest (label: Label): boolean {
    if (!this.request) return false

    return this.request.label === label
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
  async fetch (options: { data?: {} } = {}): Promise<void> {
    const label: Label = 'fetching'
    const { abort, promise } = apiClient().get(this.url(), options.data)

    this.request = new Request(label, abort, 0)

    let data

    try {
      data = await promise
    } catch (body) {
      runInAction('fetch-error', () => {
        this.error = new ErrorObject(label, body)
        this.request = null
      })

      throw body
    }

    runInAction('fetch-done', () => {
      this.set(data)
      this.request = null
      this.error = null
    })

    return data
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
  async save (
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
    const label: Label = 'updating'
    const originalAttributes = this.toJS()

    if (patch) {
      newAttributes = Object.assign({}, originalAttributes, attributes)
      data = Object.assign({}, attributes)
    } else {
      newAttributes = Object.assign({}, attributes)
      data = Object.assign({}, originalAttributes, attributes)
    }

    const onProgress = debounce(function onProgress (progress) {
      if (optimistic && this.request) {
        this.request.progress = progress
      }
    }, 300)

    const { promise, abort } = apiClient().put(this.url(), data, {
      method: patch ? 'PATCH' : 'PUT',
      onProgress
    })

    if (optimistic) this.set(newAttributes)

    this.request = new Request(label, abort, 0)

    let response

    try {
      response = await promise
    } catch (body) {
      runInAction('save-fail', () => {
        this.request = null
        this.set(originalAttributes)
        this.error = new ErrorObject(label, body)
      })

      throw isString(body) ? new Error(body) : body
    }

    runInAction('save-done', () => {
      this.request = null
      this.error = null
      this.set(response)
    })

    return response
  }

  /**
   * Internal method that takes care of creating a model that does
   * not belong to a collection
   */
  async _create (
    attributes: {},
    { optimistic = true }: CreateOptions = {}
  ): Promise<*> {
    const label: Label = 'creating'

    const onProgress = debounce(function onProgress (progress) {
      if (optimistic && this.request) {
        this.request.progress = progress
      }
    }, 300)

    const { abort, promise } = apiClient().post(this.url(), attributes, {
      onProgress
    })

    if (optimistic) {
      this.request = new Request(label, abort, 0)
    }

    let data: {}

    try {
      data = await promise
    } catch (body) {
      runInAction('create-error', () => {
        this.error = new ErrorObject(label, body)
        this.request = null
      })

      throw body
    }

    runInAction('create-done', () => {
      this.set(data)
      this.request = null
      this.error = null
    })

    return data
  }

  /**
   * Destroys the resurce on the client and
   * requests the backend to delete it there
   * too
   */
  @action
  async destroy ({ optimistic = true }: DestroyOptions = {}): Promise<*> {
    if (!this.has(this.primaryKey) && this.collection) {
      this.collection.remove([this.optimisticId])
      return Promise.resolve()
    }

    const label: Label = 'destroying'
    const { promise, abort } = apiClient().del(this.url())

    if (optimistic && this.collection) {
      this.collection.remove([this.id])
    }

    this.request = new Request(label, abort, 0)

    try {
      await promise
    } catch (body) {
      runInAction('destroy-fail', () => {
        if (optimistic && this.collection) {
          this.collection.add([this.attributes.toJS()])
        }
        this.error = new ErrorObject(label, body)
        this.request = null
      })

      throw body
    }

    runInAction('destroy-done', () => {
      if (!optimistic && this.collection) {
        this.collection.remove([this.id])
      }
      this.request = null
      this.error = null
    })

    return null
  }

  /**
   * Call an RPC action for all those
   * non-REST endpoints that you may have in
   * your API.
   */
  @action
  async rpc (method: string, body?: {}): Promise<*> {
    const label: Label = 'updating' // TODO: Maybe differentiate?
    const { promise, abort } = apiClient().post(
      `${this.url()}/${method}`,
      body || {}
    )

    this.request = new Request(label, abort, 0)

    let response

    try {
      response = await promise
    } catch (body) {
      runInAction('accept-fail', () => {
        this.request = null
        this.error = new ErrorObject(label, body)
      })

      throw body
    }

    this.request = null
    this.error = null

    return response
  }
}
