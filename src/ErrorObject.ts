export default class ErrorObject {
  error: any = null
  payload: any = {}
  requestResponse: any = null

  constructor (error: { requestResponse: any, error: any } | string | Error) {
    if (error instanceof Error) {
      console.error(error)
      this.requestResponse = null
      this.error = error
    } else if (typeof error === 'string') {
      this.requestResponse = null
      this.error = error
    } else if (error.requestResponse || error.error ){
      this.requestResponse = error.requestResponse
      this.error = error.error
    } else {
      this.payload = error
    }
  }
}
