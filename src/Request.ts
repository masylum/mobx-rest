import { observable, makeObservable, action } from 'mobx'
import { RequestOptions, RequestState } from './types'

export default class Request {
  labels: Array<string>
  abort: () => void | null
  promise: Promise<any>
  progress: number | null
  state: RequestState

  constructor (promise: Promise<any>, { labels, abort, progress = 0 }: RequestOptions = {}) {
    this.state = 'pending'
    this.labels = labels
    this.abort = abort
    this.progress = progress
    this.promise = promise

    this.promise
      .then(() => { this.fulfill() })
      .catch(() => { this.reject() })

    makeObservable(this, {
      progress: observable,
      state: observable,
      fulfill: action,
      reject: action,
      setProgress: action
    })
  }

  // This allows to use async/await on the request object
  then (onFulfilled: (any) => Promise<any>, onRejected?: (any) => Promise<any>) {
    return this.promise.then(data => onFulfilled(data || {}), onRejected)
  }

  fulfill () {
    this.state = 'fulfilled'
  }

  reject () {
    this.state = 'rejected'
  }

  setProgress (progress: number | null) {
    this.progress = progress
  }
}
