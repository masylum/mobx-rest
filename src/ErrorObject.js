// @flow
import type { Label } from './types'

export default class Request {
  label: Label;
  body: {};

  constructor (label: Label, body: {}) {
    this.label = label
    this.body = body
  }
}
