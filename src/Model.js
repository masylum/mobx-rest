// @flow
import { observable } from 'mobx'
import Collection from './Collection'
import getUuid from 'node-uuid'
import type { Uuid, Error, Request, Id, Label, DestroyOptions, SaveOptions } from './types'

class Model {
  @observable request: ?Request
  @observable error: ?Error
  @observable attributes: Object = {}

  uuid: Uuid
  collection: Collection

  constructor (collection: Collection, attributes: {}) {
    this.uuid = getUuid.v4()
    this.collection = collection
    this.set(attributes)
  }

  get (attribute: string): ?any {
    return this.attributes[attribute]
  }

  set (data: {}): void {
    this.attributes = Object.assign(this.attributes, data)
  }

  save (
    attributes: {},
    {optimistic = true, patch = true}: SaveOptions = {}
  ): Promise<*> {
    let data = Object.assign({}, attributes)
    let originalAttributes = Object.assign({}, this.attributes)
    if (!this.attributes.id) {
      return this.collection.create(attributes, {optimistic})
    }

    const label: Label = 'updating'

    if (patch) {
      data = Object.assign({}, this.attributes, attributes)
    }

    // TODO: use PATCH
    const { promise, abort } = this.collection.api.put(
      `/${this.id}`,
      data
    )

    if (optimistic) this.attributes = data

    this.request = {label, abort}

    return promise
      .then((data) => {
        this.request = null
        this.set(data)
      })
    .catch((body) => {
      this.request = null
      this.attributes = originalAttributes
      this.error = {label, body}
    })
  }

  destroy (
    {optimistic = true}: DestroyOptions = {}
  ): Promise<*> {
    if (!this.attributes.id) {
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
        if (optimistic) this.collection.add([this.attributes])
        this.error = {label, body}
        this.request = null
      })
  }

  get id (): Id {
    return this.attributes.id || this.uuid
  }
}

export default Model
