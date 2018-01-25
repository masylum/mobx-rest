// @flow
export default class ErrorObject {
  requestResponse: mixed
  error: mixed

  constructor (error: { requestResponse: mixed, error: mixed } | string | Error) {
    if (error instanceof Error) {
      console.error(error)
      this.requestResponse = null
      this.error = error
    } else if (typeof error === 'string') {
      this.requestResponse = null
      this.error = error
    } else {
      this.requestResponse = error.requestResponse
      this.error = error.error
    }
  }
}
