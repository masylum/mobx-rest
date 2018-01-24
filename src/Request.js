// @flow
import { observable } from 'mobx'
import type { RequestOptions, RequestState } from './types'

export default class Request extends Promise {
  labels: Array<string>
  abort: ?() => void
  @observable progress: ?number
  @observable state: RequestState

  constructor (promise: Promise<*>, { labels, abort, progress = 0 }: RequestOptions = {}) {
    super((resolve, reject) => promise.then(resolve).catch(reject))

    this.state = 'pending'
    this.labels = labels
    this.abort = abort
    this.progress = progress

    promise
      .then(() => { this.state = 'fulfilled' })
      .catch(() => { this.state = 'rejected' })
  }
}
