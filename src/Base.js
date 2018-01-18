// @flow
import { action, observable, IObservableArray } from 'mobx'
import apiClient from './apiClient'

export default class Base {
  @observable.shallow requests: IObservableArray = []

  /**
   * Returns the resource's url.
   *
   * @abstract
   */
  url (): string {
    throw new Error('You must implement this method')
  }

  /**
   * Questions whether the request exists
   * and matches a certain label
   */
  isRequest (label: string): boolean {
    return !!this.requests.find(request => request.labels.indexOf(label) !== -1)
  }

  async withRequest (labels: string | Array<string>, promise: Promise<*>, abort: () => void): Promise<*> {
    if (typeof labels === 'string') {
      labels = [labels]
    }

    let response
    let error
    const request = {
      labels,
      promise,
      abort
    }

    this.requests.push(request)

    try {
      response = await promise
    } catch (errorResponse) {
      error = errorResponse
    }

    this.requests.remove(request)

    if (error) {
      throw error
    }

    return response
  }

  /**
   * Call an RPC action for all those
   * non-REST endpoints that you may have in
   * your API.
   */
  @action
  rpc (label: string, endpoint: string, options?: {}): Promise<*> {
    const { promise, abort } = apiClient().post(`${this.url()}/${endpoint}`, options)

    return this.withRequest(label, promise, abort)
  }
}
