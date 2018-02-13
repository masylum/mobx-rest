// @flow
import { observable, action, computed, IObservableArray } from 'mobx'
import Model from './Model'
import { filter, isMatch, find, difference, map } from 'lodash'
import apiClient from './apiClient'
import Base from './Base'
import Request from './Request'
import type { CreateOptions, SetOptions, GetOptions, FindOptions, Id } from './types'

export default class Collection extends Base {
  @observable models: IObservableArray<Model> = []

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
  map (callback: (model: Model) => mixed): Array<*> {
    return this.models.map(callback)
  }

  /**
   * Alias for models.forEach
   */
  forEach (callback: (model: Model) => void): void {
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
  model (): Class<*> {
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
  toArray (): Array<Model> {
    return this.slice()
  }

  /**
   * Returns a defensive shallow array representation
   * of the collection
   */
  slice (): Array<Model> {
    return this.models.slice()
  }

  /**
   * Returns a shallow array representation
   * of the collection
   */
  peek (): Array<Model> {
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
  at (index: number): ?Model {
    return this.models[index]
  }

  /**
   * Get a resource with the given id or uuid
   */
  get (id: Id, { required = false }: GetOptions = {}): ?Model {
    const model = this.models.find(item => item.id === id)

    if (!model && required) {
      throw Error(`Invariant: Model must be found with id: ${id}`)
    }

    return model
  }

  /**
   * Get resources matching criteria
   */
  filter (query: { [key: string]: any } | (Model) => boolean): Array<Model> {
    return filter(this.models, (model) => {
      return typeof query === 'function'
        ? query(model)
        : isMatch(model.toJS(), query)
    })
  }

  /**
   * Finds an element with the given matcher
   */
  find (query: { [key: string]: mixed } | (Model) => boolean, { required = false }: FindOptions = {}): ?Model {
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
   * Adds a model or collection of models.
   */
  @action
  add (data: Array<{ [key: string]: any } | Model> | { [key: string]: any } | Model): void {
    if (!Array.isArray(data)) {
      data = [data]
    }

    this.models.push(...data.map(this.build))
  }

  /**
   * Resets the collection of models.
   */
  @action
  reset (data: Array<{ [key: string]: any } | Model>): void {
    this.models.replace(data.map(this.build))
  }

  /**
   * Removes the model with the given ids or uuids
   */
  @action
  remove (ids: Id | Model | Array<Id | Model>): void {
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
  build = (attributes: { [key: string]: any } = {}): Model => {
    const ModelClass = this.model()

    if (attributes instanceof ModelClass) {
      attributes.collection = this
      return attributes
    }

    if (attributes instanceof Model) {
      throw new Error(`The model must be an instance of ${ModelClass.name}`)
    }

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
    attributesOrModel: { [key: string]: any } | Model,
    { optimistic = true }: CreateOptions = {}
  ): Request {
    const model = this.build(attributesOrModel)
    const { abort, promise } = model.save()

    if (optimistic) {
      this.add(model)
    }

    promise
      .then(response => {
        if (!optimistic) {
          this.add(model)
        }
        return response
      })
      .catch(error => {
        if (optimistic) {
          this.remove(model)
        }
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

    promise
      .then(data => {
        this.set(data, options)
        return data
      })

    return this.withRequest('fetching', promise, abort)
  }
}
