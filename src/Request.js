// @flow
import { observable } from 'mobx'
import type { Label } from './types'

export default class Request {
  label: Label
  abort: () => void
  progress: number

  constructor (label: Label, abort: () => void, progress: number) {
    this.label = label
    this.abort = abort
    this.progress = observable(progress)
  }
}
