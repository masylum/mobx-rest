// @flow
import { observable } from 'mobx'

export default class Request {
  label: string
  abort: () => void
  @observable progress: number = 0

  constructor (label: string, abort: () => void, progress: number) {
    this.label = label
    this.abort = abort
    this.progress = progress
  }
}
