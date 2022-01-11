import Model, { DEFAULT_PRIMARY } from './Model'
import apiClient from './apiClient'
import ErrorObject from './ErrorObject'
import difference from 'lodash/difference'
import isObject from 'lodash/isObject'
import intersection from 'lodash/intersection'
import { observable, action, computed, IObservableArray, reaction, makeObservable } from 'mobx'
import { CreateOptions, SetOptions, GetOptions, FindOptions, Id } from './types'

type IndexTree<T> = Map<string, Index<T>>
type Index<T> = Map<any, Array<T>>

export default abstract class Collection<T extends Model> {
  models: IObservableArray<T>

  constructor (data: Array<{ [key: string]: any }> = []) {
    this.models = observable.array(data.map(m => this.build(m)))

    makeObservable(this, {
      index: computed({ keepAlive: true }),
      length: computed,
      isEmpty: computed,
      add: action,
      reset: action,
      remove: action,
      set: action,
      create: action,
      fetch: action
    })
  }

  /*
   * Override this to have more indexes
   */
  get indexes (): Array<string> {
    return []
  }

  /**
   * Define which is the primary key
   * of the model's in the collection.
   *
   * FIXME: This contains a hack to use the `primaryKey` directly
   * from the prototype. Ideally it should be static but that
   * would not be backward compatible and Typescript sucks at
   * static polymorphism (https://github.com/microsoft/TypeScript/issues/5863).
   */
  get primaryKey (): string {
    const ModelClass = this.model()
    if (!ModelClass) return DEFAULT_PRIMARY

    return ModelClass.prototype.primaryKey
  }

  /**
   * Returns a hash with all the indexes for that
   * collection.
   *
   * We keep the indexes in memory for as long as the
   * collection is alive, even if no one is referencing it.
   * This way we can ensure to calculate it only once.
   */
  get index(): IndexTree<T> {
    const indexes = this.indexes.concat([this.primaryKey])

    return indexes.reduce((tree: IndexTree<T>, attr: string) => {
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
  get length(): Number {
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
  get isEmpty(): boolean {
    return this.length === 0
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
      const optimizedQuery = Object.entries(query).sort((A, B) =>
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
   * Returns the last element of the collection
   */
  last (): T | null {
    const length = this.models.length
    if (length === 0) return null

    return this.models[length - 1]
  }

  /**
   * Adds a model or collection of models.
   */
  add(data: Array<{ [key: string]: any } | T> | { [key: string]: any } | T): Array<T> {
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
  reset(data: Array<{ [key: string]: any }>): void {
    this.models.replace(data.map(m => this.build(m)))
  }

  /**
   * Removes the model with the given ids or uuids
   */
  remove(ids: Id | T | Array<Id | T>): void {
    if (!Array.isArray(ids)) {
      ids = [ids]
    }

    const toKeep: Set<T> = new Set(this.models)

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

      toKeep.delete(model)
      model.collection = undefined
    })

    this.models.replace(Array.from(toKeep))
  }

  /**
   * Sets the resources into the collection.
   *
   * You can disable adding, changing or removing.
   */
  set(
    resources: Array<{ [key: string]: any } | T>,
    { add = true, change = true, remove = true }: SetOptions = {}
  ): void {
    const idsToRemove = new Set(this.index.get(this.primaryKey).keys())
    const resourcesToAdd = new Set([])

    idsToRemove.delete(null)

    resources.forEach(resource => {
      const id = resource[this.primaryKey]
      const model = id ? this.get(id) : null

      if (!model) {
        resourcesToAdd.add(resource)
      } else {
        idsToRemove.delete(id)

        if (change) {
          model.set(resource instanceof Model ? resource.toJS() : resource)
        }
      }
    })

    if (remove && idsToRemove.size) {
      this.remove(Array.from(idsToRemove))
    }

    if (add && resourcesToAdd.size) {
      this.add(Array.from(resourcesToAdd))
    }
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
  create(
    attributesOrModel: { [key: string]: any } | T,
    { optimistic = true, path }: CreateOptions = {}
  ): Promise<T> {
    const model = this.build(attributesOrModel)

    return model.save({}, { optimistic, path })
  }

  /**
   * Fetches the models from the backend.
   *
   * It uses `set` internally so you can
   * use the options to disable adding, changing
   * or removing.
   */
  fetch({ data, ...otherOptions }: SetOptions = {}): Promise<any> {
    const { promise } = apiClient().get(this.url(), data, otherOptions)

    return promise
      .then(data => {
        if (Array.isArray(data)) this.set(data, otherOptions)

        return data
      })
      .catch(error => {
        throw new ErrorObject(error)
      })
  }

  /**
   * Call an RPC action for all those
   * non-REST endpoints that you may have in
   * your API.
   */
  rpc(
    endpoint: string | { rootUrl: string },
    options?: {}
  ): Promise<any> {
    const url = isObject(endpoint) ? endpoint.rootUrl : `${this.url()}/${endpoint}`
    const { promise } = apiClient().post(url, options)

    return promise.catch(error => {
      throw new ErrorObject(error)
    })
  }
}
