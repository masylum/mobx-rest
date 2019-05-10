// @flow
import { action, observable, IObservableArray } from 'mobx'
import apiClient from './apiClient'
import Request from './Request'
import ErrorObject from './ErrorObject'
import { includes } from 'lodash'

export default class Base {
  @observable request: ?Request
  @observable.shallow requests: IObservableArray<Request> = []

  /**
   * Returns the resource's url.
   *
   * @abstract
   */
  url (): string {
    throw new Error('You must implement this method')
  }

  withRequest (
    labels: string | Array<string>,
    promise: Promise<*>,
    abort: ?() => void
  ): Request {
    if (typeof labels === 'string') {
      labels = [labels]
    }

    const handledPromise = promise
      .then(response => {
        this.requests.remove(request)
        return response
      })
      .catch(error => {
        this.requests.remove(request)
        throw new ErrorObject(error)
      })

    const request = new Request(handledPromise, {
      labels,
      abort
    })

    this.requests.push(request)

    return request
  }

  getRequest (label: string): ?Request {
    return this.requests.find(request => includes(request.labels, label))
  }

  getAllRequests (label: string): Array<Request> {
    return this.requests.filter(request => includes(request.labels, label))
  }

  /**
   * Questions whether the request exists
   * and matches a certain label
   */
  isRequest (label: string): boolean {
    return !!this.getRequest(label)
  }

  /**
   * Call an RPC action for all those
   * non-REST endpoints that you may have in
   * your API.
   */
  @action
  rpc (label: string, endpoint: string, options?: {}): Request {
    const { promise, abort } = apiClient().post(
      `${this.url()}/${endpoint}`,
      options
    )

    return this.withRequest(label, promise, abort)
  }
}
