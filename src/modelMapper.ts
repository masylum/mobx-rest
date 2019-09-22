import {ModelMapperAdapter} from './types'

let currentModelMapperAdapter;

/**
 * Sets or gets the api client instance
 */
export default function modelMapper(
  adapter?: ModelMapperAdapter,
  clear: boolean = false // hack for better testing
): ModelMapperAdapter {
  if (clear) {
    currentModelMapperAdapter = undefined;
  }
  if (adapter) {
    currentModelMapperAdapter = adapter;
  }

  if (!currentModelMapperAdapter && !clear) {
    throw new Error('You must set an model mapper adapter first!')
  }

  return currentModelMapperAdapter
}
