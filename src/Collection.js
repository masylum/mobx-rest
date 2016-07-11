/* globals Class */
// @flow
import { observable, computed } from 'mobx'
import Model from './Model'
import Api from './Api'
import arrayDiff from 'lodash.difference'
import arrayLast from 'lodash.last'
import type { Label, CreateOptions, Error, Request, SetOptions, Id } from './types.js'

class Collection {
  @observable request: ?Request
  @observable error: ?Error
  @observable models: [] = []

  api: Api
  basePath: string
  model: Class<Model> = Model

  constructor (data: ?[]) {
    this.api = new Api(this.basePath)

    if (data) this.set(data)
  }

  /*
   * Get a resource at a given position
   */
  at (index: number): ?Model {
    return this.models[index]
  }

  /*
   * Get a resource with the given id or uuid
   */
  get (id: Id): ?Model {
    return this.models.find((item) => item.id === id)
  }

  /**
   * Adds a collection of models.
   * Returns the added models.
   */
  add (models: Array<Object>): Array<Model> {
    const Model = this.model

    const instances = models.map((attr) => new Model(this, attr))
    this.models = this.models.concat(instances)

    return instances
  }

  /**
   * Removes the model with the given ids or uuids
   */
  remove (ids: Array<Id>): void {
    ids.forEach((id) => {
      const model = this.get(id)
      if (!model) return

      this.models.splice(this.models.indexOf(model), 1)
    })
  }

  /**
   * Set the models into the collection.
   */
  set (
    models: [],
    {add = true, change = true, remove = true}: SetOptions = {}
  ): void {
    if (remove) {
      const ids = models.map((d) => d.id)
      this.remove(arrayDiff(this.ids, ids))
    }

    models.forEach((attributes) => {
      let model = this.get(attributes.id)

      if (model && change) model.set(attributes)
      if (!model && add) this.add([attributes])
    })
  }

  create (
    attributes: Object,
    {optimistic = true}: CreateOptions = {}
  ): Promise<*> {
    const label: Label = 'creating'
    const { abort, promise } = this.api.post('', attributes)
    let model

    if (optimistic) {
      model = arrayLast(this.add([attributes]))
      model.request = {label, abort}
    }

    return promise
      .then((data) => {
        if (model) {
          model.set(data)
          model.request = null
        } else {
          this.add([data])
        }
      })
      .catch((body) => {
        if (model) this.remove([model.id])
        this.error = {label, body}
      })
  }

  fetch (): Promise<*> {
    const label: Label = 'fetching'
    const {abort, promise} = this.api.fetch('')

    this.request = {label, abort}

    return promise
      .then((data) => {
        this.request = null
        this.set(data)
      })
      .catch((body) => {
        this.request = null
        this.error = {label, body}
      })
  }

  @computed get ids (): Array<number> {
    const ids = this.models.map((item) => item.id)
      .filter(Boolean)

    // LOL flow: https://github.com/facebook/flow/issues/1414
    return ((ids.filter(Boolean): Array<any>): Array<number>)
  }
}

export default Collection
