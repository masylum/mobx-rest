import apiClient from '../src/apiClient'

describe(apiClient, () => {
  describe('if not initialized', () => {
    it('throws', () => {
      expect(() => apiClient()).toThrow('You must set an adapter first!')
    })
  })
})
