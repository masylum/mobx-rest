// @flow
import { observable, asMap, asFlat, action, asReference, ObservableMap, runInAction } from 'mobx'
import Collection from './Collection'
import { uniqueId, isString } from 'lodash'
import apiClient from './apiClient'
import type { OptimisticId, ErrorType, Request, Id, Label, DestroyOptions, SaveOptions } from './types'

export default class Model {
  @observable request: ?Request = null
  @observable error: ?ErrorType = asFlat(null)

  optimisticId: OptimisticId = uniqueId('i_')
  collection: ?Collection<*> = null
  attributes: ObservableMap

  constructor (attributes: {[key: string]: any} = {}) {
    this.attributes = asMap(attributes)
  }

  /**
   * Return the url for this given REST resource
   *
   * @abstract
   */
  url (): string {
    if (this.collection) {
      return `${this.collection.url()}/${this.get('id')}`
    }

    throw new Error('`url` method not implemented')
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
    return this.has('id')
      ? this.get('id')
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
    const { abort, promise } = apiClient().get(
      this.url(),
      options.data
    )

    this.request = {
      label,
      abort: asReference(abort),
      progress: 0
    }

    let data

    try {
      data = await promise
    } catch (body) {
      runInAction('fetch-error', () => {
        this.error = { label, body }
        this.request = null
      })

      throw body
    }

    runInAction('fetch-done', () => {
      this.set(data)
      this.request = null
    })

    return data
  }

  /**
   * Saves the resource on the backend.
   *
   * If the item has an `id` it updates it,
   * otherwise it creates the new resource.
   *
   * It supports optimistic and patch updates.
   */
  @action
  async save (
    attributes: {},
    { optimistic = true, patch = true }: SaveOptions = {}
  ): Promise<*> {
    const originalAttributes = this.attributes.toJS()
    let newAttributes
    let data

    if (!this.has('id')) {
      this.set(Object.assign({}, attributes))
      if (this.collection) {
        return this.collection.create(this, { optimistic })
      }

      throw new Error('This model does not have a collection defined')
    }

    const label: Label = 'updating'

    if (patch) {
      newAttributes = Object.assign({}, originalAttributes, attributes)
      data = Object.assign({}, attributes)
    } else {
      newAttributes = Object.assign({}, attributes)
      data = Object.assign({}, originalAttributes, attributes)
    }

    const { promise, abort } = apiClient().put(
      this.url(),
      data,
      { method: patch ? 'PATCH' : 'PUT' }
    )

    if (optimistic) this.set(newAttributes)

    this.request = {
      label,
      abort: asReference(abort),
      progress: 0
    }

    let response

    try {
      response = await promise
    } catch (body) {
      runInAction('save-fail', () => {
        this.request = null
        this.set(originalAttributes)
        this.error = { label, body }
      })

      throw isString(body) ? new Error(body) : body
    }

    runInAction('save-done', () => {
      this.request = null
      this.set(response)
    })

    return response
  }

  /**
   * Destroys the resurce on the client and
   * requests the backend to delete it there
   * too
   */
  @action
  async destroy (
    { optimistic = true }: DestroyOptions = {}
  ): Promise<*> {
    if (!this.has('id') && this.collection) {
      this.collection.remove([this.optimisticId], { optimistic })
      return Promise.resolve()
    }

    const label: Label = 'destroying'
    const { promise, abort } = apiClient().del(this.url())

    if (optimistic && this.collection) {
      this.collection.remove([this.id])
    }

    this.request = {
      label,
      abort: asReference(abort),
      progress: 0
    }

    try {
      await promise
    } catch (body) {
      runInAction('destroy-fail', () => {
        if (optimistic && this.collection) {
          this.collection.add([this.attributes.toJS()])
        }
        this.error = { label, body }
        this.request = null
      })

      throw body
    }

    runInAction('destroy-done', () => {
      if (!optimistic && this.collection) {
        this.collection.remove([this.id])
      }
      this.request = null
    })

    return null
  }

  /**
   * Call an RPC action for all those
   * non-REST endpoints that you may have in
   * your API.
   */
  @action
  async rpc (
    method: string,
    body?: {}
  ): Promise<*> {
    const label: Label = 'updating' // TODO: Maybe differentiate?
    const { promise, abort } = apiClient().post(
      `${this.url()}/${method}`,
      body || {}
    )

    this.request = {
      label,
      abort: asReference(abort),
      progress: 0
    }

    let response

    try {
      response = await promise
    } catch (body) {
      runInAction('accept-fail', () => {
        this.request = null
        this.error = { label, body }
      })

      throw body
    }

    this.request = null

    return response
  }
}
