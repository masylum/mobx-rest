import Base from './Base'
import Model, { DEFAULT_PRIMARY } from './Model'
import Request from './Request'
import apiClient from './apiClient'
import difference from 'lodash/difference'
import intersection from 'lodash/intersection'
import entries from 'lodash/entries'
import compact from 'lodash/compact'
import { observable, action, computed, IObservableArray, reaction } from 'mobx'
import { CreateOptions, SetOptions, GetOptions, FindOptions, Id } from './types'

type IndexTree<T> = Map<string, Index<T>>
type Index<T> = Map<any, Array<T>>

function getAttribute (resource: { [key: string]: any } | Model, attribute: string): any {
  if (resource instanceof Model) {
    return resource.has(attribute)
      ? resource.get(attribute)
      : null
  } else {
    return resource[attribute]
  }
}

export default abstract class Collection<T extends Model> extends Base {
  @observable models: IObservableArray<T> = observable.array([])
  indexes: Array<string> = []

  constructor (data: Array<{ [key: string]: any }> = []) {
    super()
    this.set(data)
  }

  /**
   * Define which is the primary key
   * of the model's in the collection.
   *
   * FIXME: This contains a hack to use the `primaryKey` as
   * an instance method. Ideally it should be static but that
   * would not be backward compatible and Typescript sucks at
   * static polymorphism (https://github.com/microsoft/TypeScript/issues/5863).
   */
  get primaryKey (): string {
    const ModelClass = this.model()
    if (!ModelClass) return DEFAULT_PRIMARY

    return (new ModelClass()).primaryKey
  }

  /**
   * Returns a hash with all the indexes for that
   * collection.
   *
   * We keep the indexes in memory for as long as the
   * collection is alive, even if no one is referencing it.
   * This way we can ensure to calculate it only once.
   */
  @computed({ keepAlive: true })
  get index (): IndexTree<T> {
    const indexes = this.indexes.concat([this.primaryKey])

    return indexes.reduce((tree, attr) => {
      const newIndex = this.models.reduce((index: Index<T>, model: T) => {
        const value = model.has(attr)
          ? model.get(attr)
          : null
        const oldModels = index.get(value) || []

        return index.set(value, oldModels.concat(model))
      }, new Map())

      return tree.set(attr, newIndex)
    }, new Map())
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
   */
  abstract url (): string

  /**
   * Specifies the model class for that collection
   */
  abstract model (attributes?: { [key: string]: any }): new(attributes?: {[key: string]: any}) => T | null

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
  @computed
  private get _ids (): Array<Id> {
    return compact(Array.from(this.index.get(this.primaryKey).keys()))
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
    const models = this.index.get(this.primaryKey).get(id)
    const model = models && models[0]

    if (!model && required) {
      throw new Error(`Invariant: ${this.model().name} must be found with ${this.primaryKey}: ${id}`)
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
      return this.models.filter(model => query(model))
    } else {
      // Sort the query to hit the indexes first
      const optimizedQuery = entries(query).sort((A, B) =>
        Number(this.index.has(B[0])) - Number(this.index.has(A[0]))
      )

      return optimizedQuery.reduce(
        (values: Array<T> | null, [attr, value]): Array<T> => {
          // Hitting index
          if (this.index.has(attr)) {
            const newValues = this.index.get(attr).get(value) || []
            return values ? intersection(values, newValues) : newValues
          } else {
            // Either Re-filter or Full scan
            const target = values || this.models
            return target.filter((model: T) =>
              model.has(attr) && model.get(attr) === value
            )
          }
        }, null)
    }
  }

  /**
   * Finds an element with the given matcher
   */
  find (query: { [key: string]: any } | ((T) => boolean), { required = false }: FindOptions = {}): T | null {
    const model = typeof query === 'function'
      ? this.models.find(model => query(model))
      : this.filter(query)[0]

    if (!model && required) {
      throw new Error(`Invariant: ${this.model().name} must be found`)
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

    const models = difference(
      data.map(m => this.build(m)),
      this.models
    )
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
        return console.warn(`${this.constructor.name}: ${this.model().name} with ${this.primaryKey} ${id} not found.`)
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
    resources: Array<{ [key: string]: any } | T>,
    { add = true, change = true, remove = true }: SetOptions = {}
  ): void {
    if (remove) {
      const ids = compact(resources.map(r =>
        getAttribute(r, this.primaryKey)
      ))
      const toRemove = difference(this._ids, ids)
      if (toRemove.length) this.remove(toRemove)
    }

    resources.forEach(resource => {
      const id = getAttribute(resource, this.primaryKey)
      const model = id ? this.get(id) : null

      if (model && change) {
        model.set(resource instanceof Model ? resource.toJS() : resource)
      }

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
    const request = model.save({}, { optimistic })
    this.requests.push(request)
    const { promise } = request

    promise
      .then(_response => {
        this.requests.remove(request)
      })
      .catch(error => {
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
      .then(data => {
        if (Array.isArray(data)) this.set(data, otherOptions)
      })
      .catch(_error => {}) // do nothing

    return this.withRequest('fetching', promise, abort)
  }
}
