import * as index from '../src'
import Collection from '../src/Collection'
import Model from '../src/Model'
import apiClient from '../src/apiClient'

describe('index', () => {
  it('exposes all classes', () => {
    expect(index).toEqual({
      Collection,
      Model,
      apiClient,
    })
  })
})
