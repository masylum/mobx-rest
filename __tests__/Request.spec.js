import Request from '../src/Request'

describe(Request, () => {
  describe('state', () => {
    describe('if is pending', () => {
      it('returns "pending"', () => {
        const request = new Request(new Promise(() => {}))

        expect(request.state).toBe('pending')
      })
    })

    describe('if succeeded', () => {
      it('returns "fulfilled"', async () => {
        const request = new Request(Promise.resolve())

        await request

        expect(request.state).toBe('fulfilled')
      })
    })

    describe('if fails', () => {
      it('returns "rejected"', async () => {
        const request = new Request(Promise.reject(new Error('Conflict')))

        try {
          await request
        } catch (_error) {
          expect(request.state).toBe('rejected')
        }
      })
    })
  })
})
