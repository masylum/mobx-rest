import ErrorObject from '../src/ErrorObject'

describe(ErrorObject, () => {
  let consoleError

  beforeEach(() => {
    consoleError = console.error
    console.error = jest.fn()
  })

  afterEach(() => {
    console.error = consoleError
  })

  it('handles request errors emited by the adapter', () => {
    const error = new ErrorObject({
      error: 'Not found',
      requestResponse: {
        status: 404
      }
    })

    expect(error.error).toBe('Not found')
    expect(error.requestResponse).toEqual({
      status: 404
    })
  })

  it('handles and logs generic Error instances', () => {
    const reason = new SyntaxError()
    const error = new ErrorObject(reason)

    expect(error.error).toBe(reason)
    expect(error.requestResponse).toBe(null)
    expect(console.error).toHaveBeenCalledWith(reason)
  })

  it('handles plain messages', () => {
    const reason = 'Some message'
    const error = new ErrorObject(reason)

    expect(error.error).toBe(reason)
    expect(error.requestResponse).toBe(null)
  })
})
