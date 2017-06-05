// @flow
import type { Label } from './types'

export default class ErrorObject {
  label: Label
  body: {}

  constructor (label: Label, body: {}) {
    this.label = label
    this.body = body
  }
}
