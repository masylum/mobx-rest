// @flow
export default class ErrorObject {
  requestResponse: any
  error: any

  constructor (error: { requestResponse: any, error: any } | string | Error) {
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
