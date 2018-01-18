// @flow
export default class ErrorObject {
  label: string
  body: {}

  constructor (label: string, body: {}) {
    this.label = label
    this.body = body
  }
}
