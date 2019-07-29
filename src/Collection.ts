import Base from './Base'
import Model from './Model'
import Request from './Request'
import apiClient from './apiClient'
import difference from 'lodash/difference'
import isMatch from 'lodash/isMatch'
import { observable, action, computed, IObservableArray } from 'mobx'
import { CreateOptions, SetOptions, GetOptions, FindOptions, Id } from './types'

export default abstract class Collection<T extends Model> extends Base {
  @observable models: IObservableArray<T> = observable.array([])
  indexes: Array<String> = []

  constructor (data: Array<{ [key: string]: any }> = []) {
    super()
    this.set(data)
  }

  @computed
  get index (): {
    // TODO: This should use `primaryKey`
    const indexes = this.indexes.concat(['id'])

    return _.groupBy(indexes, (index) => (
      _.groupBy(this.models, (model: T) => model.get(index))
    ))
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
  map<P> (callback: (model: T) => P): Array<P> {
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
   *
   * @abstract
   */
  abstract model (attributes?: { [key: string]: any }): new(attributes?: {[key: string]: any}) => T;

  /**
   * Returns a JSON representation
   * of the collection
   */
  toJS (): Array<{ [key: string]: any }> {
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
    // TODO: This should use `primaryKey`
    return Object.keys(this.index.id).filter(Boolean)
  }

  /**
   * Get a resource at a given position
   */
  at (index: number): T | null {
    return this.models[index]
  }

  /**
   * Get a resource with the given id or uuid
   */
  get (id: Id, { required = false }: GetOptions = {}): T {
    // TODO: This should use `primaryKey`
    const model = this.index.id[id]

    if (!model && required) {
      // TODO: This should use `primaryKey`
      throw new Error(`Invariant: Model must be found with id: ${id}`)
    }

    return model
  }

  /**
   * Get a resource with the given id or uuid or fail loudly.
   */
  mustGet (id: Id): T {
    return this.get(id, { required: true })
  }

  /**
   * Get resources matching criteria.
   *
   * If passing an object of key:value conditions, it will
   * use the indexes to efficiently retrieve the data.
   */
  filter (query: { [key: string]: any } | ((T) => boolean)): Array<T> {
    if (typeof query === 'function') {
      return this.models.filter(query)
    } else {
      // Sort the query to hit the indexes first
      const optimizedQuery = _.sortBy(query, (attr) => this.index[attr])
      return _.reduce(optimizedQuery, (memo, attr, value) => {
        // Hitting index
        if (this.index[attr]) {
          return {
            values: _.intersection(memo.values, this.index[attr][value]),
            iteration: memo.iteration++
          }
        } else {
          // Either Re-filter or Full scan
          const target = memo.iteration > 0 ? memo : this.models
          return {
            values: target.filter((model: T) => model.get(attr) === value),
            iteration: memo.iteration++
          }
        }
      }, { iteration: 0, values: []}).values
    }
  }

  /**
   * Finds an element with the given matcher
   */
  find (query: { [key: string]: any } | ((T) => boolean), { required = false }: FindOptions = {}): T | null {
    const model = typeof query === 'function'
      ? this.models.find(query)
      : this.filter(query)[0]

    if (!model && required) {
      throw new Error(`Invariant: Model must be found`)
    }

    return model
  }

  /**
   * Get a resource with the given id or uuid or fails loudly.
   */
  mustFind (query: { [key: string]: any } | ((T) => boolean)): T {
    return this.find(query, { required: true })
  }

  /**
   * Adds a model or collection of models.
   */
  @action
  add (data: Array<{ [key: string]: any } | T> | { [key: string]: any } | T): Array<T> {
    if (!Array.isArray(data)) data = [data]

    const models = data.map(m => this.build(m))
    this.models.push(...models)

    return models
  }

  /**
   * Resets the collection of models.
   */
  @action
  reset (data: Array<{ [key: string]: any }>): void {
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
      } else if (typeof id === 'number' || typeof id === 'string') {
        model = this.get(id)
      }

      if (!model) {
        // TODO: This should use `primaryKey`
        return console.warn(`${this.constructor.name}: Model with id ${id} not found.`)
      }

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
      // TODO: This should use `primaryKey`
      const ids = resources.map(r => r.id)
      const toRemove = difference(this._ids(), ids)
      if (toRemove.length) this.remove(toRemove)
    }

    resources.forEach(resource => {
      // TODO: This should use `primaryKey`
      const model = this.get(resource.id)

      if (model && change) model.set(resource)
      if (!model && add) this.add([resource])
    })
  }

  /**
   * Creates a new model instance with the given attributes
   */
  build (attributes: Object | T = {}): T {
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
    const request = model.save()
    this.requests.push(request)
    const { promise } = request

    if (optimistic) {
      this.add(model)
    }

    promise
      .then(response => {
        if (!optimistic) this.add(model)
        this.requests.remove(request)
      })
      .catch(error => {
        if (optimistic) this.remove(model)
        this.requests.remove(request)
      })

    return request
  }

  /**
   * Fetches the models from the backend.
   *
   * It uses `set` internally so you can
   * use the options to disable adding, changing
   * or removing.
   */
  @action
  fetch ({ data, ...otherOptions }: SetOptions = {}): Request {
    const { abort, promise } = apiClient().get(this.url(), data, otherOptions)

    promise
      .then(data => this.set(data, otherOptions))
      .catch(_error => {}) // do nothing

    return this.withRequest('fetching', promise, abort)
  }
}
