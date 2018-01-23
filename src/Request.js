// @flow
import { observable } from 'mobx'
import type { RequestOptions } from './types'

export default class Request extends Promise {
  labels: Array<string>
  abort: ?() => void
  @observable progress: ?number

  constructor ({ labels, resolver, abort, progress = 0 }: RequestOptions) {
    super(resolver)

    this.labels = labels
    this.abort = abort
    this.progress = progress
  }
}
