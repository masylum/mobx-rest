// @flow
export default class ErrorObject {
  requestResponse: mixed
  error: mixed

  constructor ({ requestResponse, error }: { requestResponse: mixed, error: mixed }) {
    this.requestResponse = requestResponse
    this.error = error
  }
}
