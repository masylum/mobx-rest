import ErrorObject from './ErrorObject'
import Request from './Request'
import apiClient from './apiClient'
import { includes, isObject } from 'lodash'
import { action, observable, IObservableArray } from 'mobx'

export default class Base {
  @observable request: Request | null
  @observable.shallow requests: IObservableArray<Request> = observable.array([])

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
    promise: Promise<any>,
    abort: () => void | null
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

  getRequest (label: string): Request | null {
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
  // TODO: Type endpoint with string | { rootUrl: string }
  @action
  rpc (endpoint: any, options?: {}, label: string = 'fetching'): Request {
    const url = isObject(endpoint) ? endpoint.rootUrl : `${this.url()}/${endpoint}`
    const { promise, abort } = apiClient().post(url, options)

    return this.withRequest(label, promise, abort)
  }
}
