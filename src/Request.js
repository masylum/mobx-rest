// @flow
import { observable } from 'mobx'
import type { RequestOptions } from './types'

export default class Request {
  labels: Array<string>
  promise: Promise<*>
  abort: ?() => void
  @observable progress: ?number

  constructor ({ labels, promise, abort, progress = 0 }: RequestOptions) {
    this.labels = labels
    this.promise = promise
    this.abort = abort
    this.progress = progress

    this.then = this.promise.then.bind(this.promise)
    this.catch = this.promise.catch.bind(this.promise)
  }
}
