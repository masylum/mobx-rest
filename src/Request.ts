import { runInAction, observable } from 'mobx'
import { RequestOptions, RequestState } from './types'

export default class Request {
  labels: Array<string>
  abort: () => void | null
  promise: Promise<any>
  @observable progress: number | null
  @observable state: RequestState

  constructor (promise: Promise<any>, { labels, abort, progress = 0 }: RequestOptions = {}) {
      runInAction('init request request', () => {
          this.state = 'pending'
          this.labels = labels
          this.abort = abort
          this.progress = progress = 0
          this.promise = promise
      })

      this.promise
      .then(() => {  runInAction('change request state', () => this.state = 'fulfilled') })
      .catch(() => { runInAction('change request state', () => this.state = 'rejected') })
  }

  // This allows to use async/await on the request object
  then (onFulfilled: (any) => Promise<any>, onRejected?: (any) => Promise<any>) {
    return this.promise.then(data => onFulfilled(data || {}), onRejected)
  }
}
