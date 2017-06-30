// @flow
import { observable, action, IObservableArray, runInAction, toJS } from 'mobx'
import Model from './Model'
import {
  isEmpty,
  filter,
  isMatch,
  find,
  difference,
  debounce,
  map,
  last
} from 'lodash'
import ErrorObject from './ErrorObject'
import Request from './Request'
import apiClient from './apiClient'
import type { Label, CreateOptions, SetOptions, Id } from './types'

export default class Collection<T: Model> {
  @observable request: ?Request = null
  @observable error: ?ErrorObject = null
  @observable models: IObservableArray<T> = []

  constructor (data: Array<{ [key: string]: any }> = []) {
    this.set(data)
  }

  /**
   * Returns the URL where the model's resource would be located on the server.
   *
   * @abstract
   */
  url (): string {
    throw new Error('You must implement this method')
  }

  /**
   * Specifies the model class for that collection
   */
  model (): Class<*> {
    return Model
  }

  /**
   * Returns a JSON representation
   * of the collection
   */
  toJS () {
    return toJS(this.models)
  }

  /**
   * Returns a shallow array representation
   * of the collection
   */
  toArray () {
    return this.models.slice()
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
   * Wether the collection is empty
   */
  isEmpty (): boolean {
    return isEmpty(this.models)
  }

  /**
   * Gets the ids of all the items in the collection
   */
  _ids (): Array<Id> {
    return map(this.models, item => item.id).filter(Boolean)
  }

  /**
   * Get a resource at a given position
   */
  at (index: number): ?T {
    return this.models[index]
  }

  /**
   * Get a resource with the given id or uuid
   */
  get (id: Id): ?T {
    return this.models.find(item => item.id === id)
  }

  /**
   * The whinny version of the `get` method
   */
  mustGet (id: Id): T {
    const model = this.get(id)

    if (!model) throw Error(`Invariant: Model must be found with id: ${id}`)

    return model
  }

  /**
   * Get resources matching criteria
   */
  filter (query: { [key: string]: any } = {}): Array<T> {
    return filter(this.models, ({ attributes }) => {
      return isMatch(attributes.toJS(), query)
    })
  }

  /**
   * Finds an element with the given matcher
   */
  find (query: { [key: string]: mixed }): ?T {
    return find(this.models, ({ attributes }) => {
      return isMatch(attributes.toJS(), query)
    })
  }

  /**
   * The whinny version of `find`
   */
  mustFind (query: { [key: string]: mixed }): T {
    const model = this.find(query)

    if (!model) {
      const conditions = JSON.stringify(query)
      throw Error(`Invariant: Model must be found with: ${conditions}`)
    }

    return model
  }

  /**
   * Adds a collection of models.
   * Returns the added models.
   */
  @action
  add (data: Array<{ [key: string]: any }>): Array<T> {
    const models = data.map(d => this.build(d))
    this.models.push(...models)
    return models
  }

  /**
   * Removes the model with the given ids or uuids
   */
  @action
  remove (ids: Array<Id>): void {
    ids.forEach(id => {
      const model = this.get(id)
      if (!model) return

      this.models.splice(this.models.indexOf(model), 1)
    })
  }

  /**
   * Sets the resources into the collection.
   *
   * You can disable adding, changing or removing.
   */
  @action
  set (
    resources: Array<{ [key: string]: any }>,
    { add = true, change = true, remove = true }: SetOptions = {}
  ): void {
    if (remove) {
      const ids = resources.map(r => r.id)
      const toRemove = difference(this._ids(), ids)
      if (toRemove.length) this.remove(toRemove)
    }

    resources.forEach(resource => {
      const model = this.get(resource.id)

      if (model && change) model.set(resource)
      if (!model && add) this.add([resource])
    })
  }

  /**
   * Creates a new model instance with the given attributes
   */
  build (attributes: { [key: string]: any } = {}): T {
    const ModelClass = this.model()
    const model = new ModelClass(attributes)
    model.collection = this

    return model
  }

  /**
   * Creates the model and saves it on the backend
   *
   * The default behaviour is optimistic but this
   * can be tuned.
   */
  @action
  async create (
    attributesOrModel: { [key: string]: any } | Model,
    { optimistic = true }: CreateOptions = {}
  ): Promise<*> {
    let model
    let attributes = attributesOrModel instanceof Model
      ? attributesOrModel.toJS()
      : attributesOrModel
    const label: Label = 'creating'

    const onProgress = debounce(function onProgress (progress) {
      if (optimistic && model.request) {
        model.request.progress = progress
      }

      if (this.request) {
        this.request.progress = progress
      }
    }, 300)

    const { abort, promise } = apiClient().post(this.url(), attributes, {
      onProgress
    })

    if (optimistic) {
      model = attributesOrModel instanceof Model
        ? attributesOrModel
        : last(this.add([attributesOrModel]))
      model.request = new Request(label, abort, 0)
    }

    this.request = new Request(label, abort, 0)

    let data: {}

    try {
      data = await promise
    } catch (body) {
      runInAction('create-error', () => {
        if (model) {
          this.remove([model.id])
        }
        this.error = new ErrorObject(label, body)
        this.request = null
      })

      throw body
    }

    runInAction('create-done', () => {
      if (model) {
        model.set(data)
        model.request = null
      } else {
        this.add([data])
      }
      this.request = null
      this.error = null
    })

    return data
  }

  /**
   * Fetches the models from the backend.
   *
   * It uses `set` internally so you can
   * use the options to disable adding, changing
   * or removing.
   */
  @action
  async fetch (options: SetOptions = {}): Promise<void> {
    const label: Label = 'fetching'
    const { abort, promise } = apiClient().get(this.url(), options.data)

    this.request = new Request(label, abort, 0)

    let data: Array<{ [key: string]: any }>

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
      this.set(data, options)
      this.request = null
      this.error = null
    })

    return data
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
