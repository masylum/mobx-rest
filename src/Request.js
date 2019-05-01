// @flow
import { observable } from 'mobx'
import type { RequestOptions, RequestState } from './types'

export default class Request {
  labels: Array<string>
  promise: Promise<*>
  @observable progress: ?number
  @observable state: RequestState

  constructor (promise: Promise<*>, { labels, progress = 0 }: RequestOptions = {}) {
    this.state = 'pending'
    this.labels = labels
    this.progress = progress
    this.promise = promise

    promise
      .then(() => { this.state = 'fulfilled' })
      .catch(() => { this.state = 'rejected' })
  }

  // This allows to use async/await on the request object
  then (onFulfilled: any => Promise<*>, onRejected?: any => Promise<*>) {
    return this.promise.then(onFulfilled, onRejected)
  }
}
