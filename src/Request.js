// @flow
import { observable } from 'mobx'
import type { RequestOptions } from './types'

export default class Request {
  labels: Array<string>
  promise: Promise<*>
  abort: ?() => void
  @observable progress: ?number = 0

  constructor ({ labels, promise, abort, progress }: RequestOptions) {
    this.labels = labels
    this.promise = promise
    this.abort = abort
    this.progress = progress
  }
}
