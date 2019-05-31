import * as index from '../src'
import Collection from '../src/Collection'
import ErrorObject from '../src/ErrorObject'
import Model from '../src/Model'
import Request from '../src/Request'
import apiClient from '../src/apiClient'

describe('index', () => {
  it('exposes all classes', () => {
    expect(index).toEqual({
      Collection,
      ErrorObject,
      Model,
      Request,
      apiClient
    })
  })
})
