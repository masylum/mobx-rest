// @flow
import { observable, IObservableArray } from 'mobx'

export default class Base {
  @observable.shallow requests: IObservableArray = []

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
}
