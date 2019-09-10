import { ModelMapperAdapter } from './types'

let currentModelMapperAdapter;

/**
 * Sets or gets the api client instance
 */
export default function modelMapper(
  adapter?: ModelMapperAdapter
): ModelMapperAdapter {
  if (adapter) {
    currentModelMapperAdapter = adapter;
  }

  if (!currentModelMapperAdapter) {
    throw new Error('You must set an model mapper adapter first!')
  }

  return currentModelMapperAdapter
}
