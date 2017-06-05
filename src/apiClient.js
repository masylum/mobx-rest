// @flow
import type { Adapter } from './types'

let currentAdapter

/**
 * Sets or gets the api client instance
 */
export default function apiClient (
  adapter?: Adapter,
  options: { [key: string]: any } = {}
): Adapter {
  if (adapter) {
    currentAdapter = Object.assign({}, adapter, options)
  }

  if (!currentAdapter) {
    throw new Error('You must set an adapter first!')
  }

  return currentAdapter
}
