// @flow
import { observable, asMap, action, ObservableMap } from 'mobx'
import Collection from './Collection'
import getUuid from 'node-uuid'
import type { Uuid, Error, Request, Id, Label, DestroyOptions, SaveOptions } from './types'

class Model {
  @observable request: ?Request
  @observable error: ?Error

  uuid: Uuid
  collection: Collection
  attributes: ObservableMap

  constructor (collection: Collection, attributes: {}) {
    this.uuid = getUuid.v4()
    this.collection = collection
    this.attributes = observable(asMap(attributes))
  }

  get (attribute: string): ?any {
    return this.attributes.get(attribute)
  }

  @action set (data: {}): void {
    this.attributes.merge(data)
  }

  @action save (
    attributes: {},
    {optimistic = true, patch = true}: SaveOptions = {}
  ): Promise<*> {
    let originalAttributes = this.attributes.toJS()
    let newAttributes
    let data

    if (!this.get('id')) {
      return this.collection.create(attributes, {optimistic})
    }

    const label: Label = 'updating'

    if (patch) {
      newAttributes = Object.assign({}, originalAttributes, attributes)
      data = Object.assign({}, attributes)
    } else {
      newAttributes = Object.assign({}, attributes)
      data = Object.assign({}, originalAttributes, attributes)
    }

    // TODO: use PATCH
    const { promise, abort } = this.collection.api.put(
      `/${this.id}`,
      data
    )

    if (optimistic) this.attributes = asMap(newAttributes)

    this.request = {label, abort}

    return promise
      .then((data) => {
        this.request = null
        this.set(data)

        return data
      })
      .catch((body) => {
        this.request = null
        this.attributes = asMap(originalAttributes)
        this.error = {label, body}
      })
  }

  @action destroy (
    {optimistic = true}: DestroyOptions = {}
  ): Promise<*> {
    if (!this.get('id')) {
      this.collection.remove([this.uuid], {optimistic})
      return Promise.resolve()
    }

    const label: Label = 'destroying'
    const { promise, abort } = this.collection.api.del(`/${this.id}`)

    if (optimistic) this.collection.remove([this.id])

    this.request = {label, abort}

    return promise
      .then(() => {
        if (!optimistic) this.collection.remove([this.id])
        this.request = null
      })
      .catch((body) => {
        if (optimistic) this.collection.add([this.attributes.toJS()])
        this.error = {label, body}
        this.request = null
      })
  }

  get id (): Id {
    return this.get('id') || this.uuid
  }
}

export default Model
