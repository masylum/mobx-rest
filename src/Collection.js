// @flow
import { observable, action, computed, IObservableArray, toJS } from 'mobx'
import Model from './Model'
import {
  isFunction,
  isArray,
  filter,
  isMatch,
  find,
  difference,
  map,
  last
} from 'lodash'
import ErrorObject from './ErrorObject'
import Request from './Request'
import apiClient from './apiClient'
import Base from './Base'
import type { CreateOptions, SetOptions, Id } from './types'

export default class Collection<T: Model> extends Base {
  @observable request: ?Request = null
  @observable error: ?ErrorObject = null
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
  map (callback): Array<*> {
    return this.models.map(callback)
  }

  /**
   * Alias for models.forEach
   */
  forEach (callback): Array<*> {
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
  toJS () {
    return this.models.map(model => model.toJS())
  }

  /**
   * Returns a defensive shallow array representation
   * of the collection
   */
  slice () {
    return this.models.slice()
  }

  /**
   * Returns a shallow array representation
   * of the collection
   */
  peek () {
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
  get (id: Id, { mustGet = false } = {}): ?T {
    const model = this.models.find(item => item.id === id)

    if (!model && mustGet) {
      throw Error(`Invariant: Model must be found with id: ${id}`)
    }

    return model
  }

  /**
   * Get resources matching criteria
   */
  filter (query: { [key: string]: any }): Array<T> {
    return filter(this.models, (model) => {
      return isFunction(query)
        ? query(model)
        : isMatch(model.toJS(), query)
    })
  }

  /**
   * Finds an element with the given matcher
   */
  find (query: { [key: string]: mixed }, { mustFind = false } = {}): ?T {
    const model = find(this.models, (model) => {
      return isFunction(query)
        ? query(model)
        : isMatch(model.toJS(), query)
    })

    if (!model && mustFind) {
      throw Error(`Invariant: Model must be found`)
    }

    return model
  }

  /**
   * Adds a model or collection of models.
   */
  @action
  add (data: Array<{ [key: string]: any }>): Array<T> {
    if (!isArray(data)) {
      data = [data]
    }

    this.models.push(...data.map(this.build))
  }

  /**
   * Resets the collection of models.
   */
  @action
  reset (data: Array<{ [key: string]: any }>): Array<T> {
    this.models.replace(data.map(this.build))
  }

  /**
   * Removes the model with the given ids or uuids
   */
  @action
  remove (ids: Array<Id>): void {
    if (!isArray(ids)) {
      ids = [ids]
    }

    ids.forEach(id => {
      let model

      if (id instanceof Model && id.collection === this) {
        model = id
      } else {
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
  build = (attributes: { [key: string]: any } = {}): T => {
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
  async create (
    attributesOrModel: { [key: string]: any } | Model,
    { optimistic = true }: CreateOptions = {}
  ): Promise<*> {
    const model = this.build(attributesOrModel)
    const promise = model.save()

    if (optimistic) {
      this.add(model)
    }

    return this.withRequest('creating', promise)
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
  }

  /**
   * Fetches the models from the backend.
   *
   * It uses `set` internally so you can
   * use the options to disable adding, changing
   * or removing.
   */
  @action
  fetch (options: SetOptions = {}): Promise<void> {
    const { abort, promise } = apiClient().get(this.url(), options)

    return this.withRequest('fetching', promise, abort)
      .then(data => {
        this.set(data, options)
        return data
      })
  }
}
