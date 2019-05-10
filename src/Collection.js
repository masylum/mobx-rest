// @flow
import Base from './Base'
import Model from './Model'
import Request from './Request'
import apiClient from './apiClient'
import { filter, isMatch, find, difference, map } from 'lodash'
import { observable, action, computed, IObservableArray } from 'mobx'

import type { CreateOptions, SetOptions, GetOptions, FindOptions, Id } from './types'

export default class Collection<T: Model> extends Base {
  @observable models: IObservableArray<T> = []

  constructor (data: Array<{ [key: string]: any }> = []) {
    super()
    this.set(data)
  }

  /**
   * Alias for models.length
   */
  @computed
  get length (): Number {
    return this.models.length
  }

  /**
   * Alias for models.map
   */
  map (callback: (model: T) => mixed): Array<*> {
    return this.models.map(callback)
  }

  /**
   * Alias for models.forEach
   */
  forEach (callback: (model: T) => void): void {
    return this.models.forEach(callback)
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
  model (attributes: { [key: string]: any } = {}): Class<*> {
    return Model
  }

  /**
   * Returns a JSON representation
   * of the collection
   */
  toJS (): Array<{ [string]: mixed }> {
    return this.models.map(model => model.toJS())
  }

  /**
   * Alias of slice
   */
  toArray (): Array<T> {
    return this.slice()
  }

  /**
   * Returns a defensive shallow array representation
   * of the collection
   */
  slice (): Array<T> {
    return this.models.slice()
  }

  /**
   * Returns a shallow array representation
   * of the collection
   */
  peek (): Array<T> {
    return this.models.peek()
  }

  /**
   * Wether the collection is empty
   */
  @computed
  get isEmpty (): boolean {
    return this.length === 0
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
  get (id: Id, { required = false }: GetOptions = {}): ?T {
    const model = this.models.find(item => item.id === id)

    if (!model && required) {
      throw Error(`Invariant: Model must be found with id: ${id}`)
    }

    return model
  }

  /**
   * Get a resource with the given id or uuid or fail loudly.
   */
  mustGet (id: Id): ?T {
    return this.get(id, { required: true })
  }

  /**
   * Get resources matching criteria
   */
  filter (query: { [key: string]: any } | (T) => boolean): Array<T> {
    return filter(this.models, (model) => {
      return typeof query === 'function'
        ? query(model)
        : isMatch(model.toJS(), query)
    })
  }

  /**
   * Finds an element with the given matcher
   */
  find (query: { [key: string]: mixed } | (T) => boolean, { required = false }: FindOptions = {}): ?T {
    const model = find(this.models, (model) => {
      return typeof query === 'function'
        ? query(model)
        : isMatch(model.toJS(), query)
    })

    if (!model && required) {
      throw Error(`Invariant: Model must be found`)
    }

    return model
  }

  /**
   * Get a resource with the given id or uuid or fails loudly.
   */
  mustFind (query: { [key: string]: mixed } | (T) => boolean): ?T {
    return this.find(query, { required: true })
  }

  /**
   * Adds a model or collection of models.
   */
  @action
  add (data: Array<{ [key: string]: any } | T> | { [key: string]: any } | T): void {
    if (!Array.isArray(data)) {
      data = [data]
    }

    this.models.push(...data.map(m => this.build(m)))
  }

  /**
   * Resets the collection of models.
   */
  @action
  reset (data: Array<{ [key: string]: any } | T>): void {
    this.models.replace(data.map(m => this.build(m)))
  }

  /**
   * Removes the model with the given ids or uuids
   */
  @action
  remove (ids: Id | T | Array<Id | T>): void {
    if (!Array.isArray(ids)) {
      ids = [ids]
    }

    ids.forEach(id => {
      let model

      if (id instanceof Model && id.collection === this) {
        model = id
      } else if (typeof id === 'number') {
        model = this.get(id)
      }

      if (!model) return

      this.models.splice(this.models.indexOf(model), 1)
      model.collection = undefined
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
    if (attributes instanceof Model) {
      attributes.collection = this
      return attributes
    }

    const ModelClass = this.model(attributes)
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
  create (
    attributesOrModel: { [key: string]: any } | T,
    { optimistic = true }: CreateOptions = {}
  ): Request {
    const model = this.build(attributesOrModel)
    const { abort, promise } = model.save() // TODO: Progress?

    if (optimistic) {
      this.add(model)
    }

    promise
      .then(response => {
        if (!optimistic) this.add(model)
      })
      .catch(error => {
        if (optimistic) this.remove(model)

        throw error
      })

    return this.withRequest('creating', promise, abort)
  }

  /**
   * Fetches the models from the backend.
   *
   * It uses `set` internally so you can
   * use the options to disable adding, changing
   * or removing.
   */
  @action
  fetch (options: SetOptions = {}): Request {
    const { abort, promise } = apiClient().get(this.url(), options)

    promise.then(data => this.set(data, options))

    return this.withRequest('fetching', promise, abort)
  }
}
