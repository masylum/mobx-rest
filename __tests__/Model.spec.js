import { Collection, Model, apiClient, Request } from '../src'
import MockApi from './mocks/api'
import ErrorObject from '../src/ErrorObject'

const error = 'boom!'
const errorObject = new ErrorObject('fetch', error)

apiClient(MockApi)

class MyCollection extends Collection {
  url () {
    return '/resources'
  }

  model () {
    return MyModel
  }
}

class MyModel extends Model {
  urlRoot () {
    return '/resources'
  }
}

describe('Model', () => {
  let collection
  let model
  let item

  function resolve (attr) {
    return () => {
      apiClient().resolver = (resolve) => resolve(attr)
    }
  }

  function reject () {
    apiClient().resolver = (_resolve, reject) => reject(error)
  }

  beforeEach(() => {
    item = { id: 1, name: 'miles', album: 'kind of blue' }
    collection = new MyCollection([item])
    model = collection.at(0)
  })

  describe('isRequest', () => {
    it('returns false if there is no request', () => {
      const newModel = new MyModel({})
      expect(newModel.isRequest('fetching')).toBe(false)
    })

    it('return false if the request is something different', () => {
      const newModel = new MyModel({})
      newModel.request = new Request('creating', null, 0)
      expect(newModel.isRequest('fetching')).toBe(false)
    })

    it('return true if the request is matching', () => {
      const newModel = new MyModel({})
      newModel.request = new Request('fetching', null, 0)
      expect(newModel.isRequest('fetching')).toBe(true)
    })
  })

  describe('isNew', () => {
    it('returns true if it does not have an id', () => {
      const newModel = new MyModel({})
      expect(newModel.isNew).toBe(true)
    })

    it('returns false if it does not have an id', () => {
      const newModel = new MyModel({ id: 4 })
      expect(newModel.isNew).toBe(false)
    })
  })

  describe('url', () => {
    describe('when the model has a collection', () => {
      it('returns the collection one', () => {
        expect(model.url()).toBe('/resources/1')
      })
    })

    describe('when the model has no collection', () => {
      describe('and no urlRoot', () => {
        it('throws', () => {
          expect(() => {
            const newModel = new Model({ id: 1 })
            newModel.url()
          }).toThrowError()
        })
      })

      describe('and urlRoot is defined', () => {
        it('returns different urls depending whether is new or not', () => {
          let newModel

          newModel = new MyModel({})
          expect(newModel.url()).toBe('/resources')

          newModel = new MyModel({ id: 3 })
          expect(newModel.url()).toBe('/resources/3')
        })
      })
    })
  })

  describe('get', () => {
    it('returns the attribute', () => {
      expect(model.get('name')).toBe(item.name)
    })

    it('throws if the attribute is not found', () => {
      expect(() => {
        model.get('lol')
      }).toThrowError()
    })
  })

  describe('set', () => {
    const name = 'dylan'

    it('changes the given key value', () => {
      model.set({ name: 'dylan' })
      expect(model.get('name')).toBe(name)
      expect(model.get('album')).toBe(item.album)
    })
  })

  describe('save', () => {
    const name = 'dylan'

    describe('if the item is not persisted', () => {
      beforeEach(() => model.attributes.delete('id'))

      describe('and it has a collection', () => {
        it('it adds the model', () => {
          collection.create = jest.fn()
          model.save(item)
          expect(collection.create).toBeCalledWith(model, { optimistic: true })
        })
      })

      describe('and it does not have a collection', () => {
        beforeEach(() => {
          model.collection = null
        })

        describe('if its optimistic (default)', () => {
          it('it sets model straight away', () => {
            model.save({ name })
            expect(model.get('name')).toBe('dylan')
            expect(model.get('album')).toBe(item.album)
            expect(model.request.label).toBe('creating')
          })

          describe('when it fails', () => {
            beforeEach(reject)

            it('sets the error', () => {
              return model.save({ name }).catch(() => {
                expect(model.error.label).toBe('creating')
                expect(model.error.body).toBe(error)
              })
            })

            it('nullifies the request', () => {
              return model.save({ name }).catch(() => {
                expect(model.request).toBe(null)
              })
            })
          })

          describe('when it succeeds', () => {
            beforeEach(() => {
              model.error = errorObject
              resolve({ id: 1, name: 'coltrane' })()
            })

            it('updates the data from the server', () => {
              return model.save({ name }).then(() => {
                expect(model.get('name')).toBe('coltrane')
              })
            })

            it('nullifies the request', () => {
              return model.save({ name }).then(() => {
                expect(model.request).toBe(null)
              })
            })

            it('clears the error', async () => {
              await model.save({ name })
              expect(model.error).toBe(null)
            })
          })
        })

        describe('if its pessimistic', () => {
          describe('when it fails', () => {
            beforeEach(reject)

            it('sets the error', () => {
              return model.save({ name }, { optimistic: false }).catch(() => {
                expect(model.error.label).toBe('creating')
                expect(model.error.body).toBe(error)
              })
            })

            it('nullifies the request', () => {
              return model.save({ name }).catch(() => {
                expect(model.request).toBe(null)
              })
            })
          })

          describe('when it succeeds', () => {
            beforeEach(() => {
              model.error = errorObject
              resolve({ id: 2, name: 'dylan' })()
            })

            it('adds data from the server', () => {
              return model.save({ name }, { optimistic: false }).then(() => {
                expect(model.get('name')).toBe('dylan')
              })
            })

            it('nullifies the request', () => {
              return model.save({ name }).then(() => {
                expect(model.request).toBe(null)
              })
            })

            it('clears the error', async () => {
              await model.save({ name })
              expect(model.error).toBe(null)
            })
          })
        })
      })
    })

    describe('if its optimistic (default)', () => {
      describe('and its patching (default)', () => {
        it('it sets model straight away', () => {
          model.save({ name })
          expect(model.get('name')).toBe('dylan')
          expect(model.get('album')).toBe(item.album)
          expect(model.request.label).toBe('updating')
        })
      })

      describe('and its not patching', () => {
        it('it sets model straight away', () => {
          model.save({ name }, { patch: false })
          expect(model.get('name')).toBe('dylan')
          expect(model.get('album')).toBe('kind of blue')
          expect(model.request.label).toBe('updating')
        })
      })

      describe('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return model.save({ name }).catch(() => {
            expect(model.error.label).toBe('updating')
            expect(model.error.body).toBe(error)
          })
        })

        it('rolls back the changes', () => {
          return model.save({ name }).catch(() => {
            expect(model.get('name')).toBe(item.name)
            expect(model.get('album')).toBe(item.album)
            expect(model.request).toBe(null)
          })
        })

        it('nullifies the request', () => {
          return model.save({ name }).catch(() => {
            expect(model.request).toBe(null)
          })
        })
      })

      describe('when it succeeds', () => {
        beforeEach(() => {
          model.error = errorObject
          resolve({ id: 1, name: 'coltrane' })()
        })

        it('updates the data from the server', () => {
          return model.save({ name }).then(() => {
            expect(model.get('name')).toBe('coltrane')
          })
        })

        it('nullifies the request', () => {
          return model.save({ name }).then(() => {
            expect(model.request).toBe(null)
          })
        })

        it('clears the error', async () => {
          await model.save({ name })
          expect(model.error).toBe(null)
        })
      })
    })

    describe('if its pessimistic', () => {
      describe('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return model.save({ name }, { optimistic: false }).catch(() => {
            expect(model.error.label).toBe('updating')
            expect(model.error.body).toBe(error)
          })
        })

        it('nullifies the request', () => {
          return model.save({ name }).catch(() => {
            expect(model.request).toBe(null)
          })
        })
      })

      describe('when it succeeds', () => {
        beforeEach(() => {
          model.error = errorObject
          resolve({ id: 2, name: 'dylan' })()
        })

        it('adds data from the server', () => {
          return model.save({ name }, { optimistic: false }).then(() => {
            expect(model.get('name')).toBe('dylan')
          })
        })

        it('nullifies the request', () => {
          return model.save({ name }).then(() => {
            expect(model.request).toBe(null)
          })
        })

        it('clears the error', async () => {
          await model.save({ name })
          expect(model.error).toBe(null)
        })
      })
    })
  })

  describe('destroy', () => {
    describe('if the item is not persisted', () => {
      beforeEach(() => model.attributes.delete('id'))

      it('it removes the model', () => {
        collection.remove = jest.fn()
        model.destroy()
        expect(collection.remove).toBeCalledWith(
          [model.optimisticId],
          { optimistic: true }
        )
      })
    })

    describe('if its optimistic (default)', () => {
      it('it removes the model straight away', () => {
        model.destroy()
        expect(collection.models.length).toBe(0)
      })

      describe('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return model.destroy().catch(() => {
            expect(model.error.label).toBe('destroying')
            expect(model.error.body).toBe(error)
          })
        })

        it('rolls back the changes', () => {
          return model.destroy().catch(() => {
            expect(collection.models.length).toBe(1)
            expect(collection.at(0).get('name')).toBe(item.name)
          })
        })

        it('nullifies the request', () => {
          return model.destroy().catch(() => {
            expect(model.request).toBe(null)
          })
        })
      })

      describe('when it succeeds', () => {
        beforeEach(() => {
          model.error = errorObject
          resolve()()
        })

        it('nullifies the request', () => {
          return model.destroy().then(() => {
            expect(model.request).toBe(null)
          })
        })

        it('clears the error', async () => {
          await model.save({ name })
          expect(model.error).toBe(null)
        })
      })
    })

    describe('if its pessimistic', () => {
      describe('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return model.destroy({ optimistic: false }).catch(() => {
            expect(model.error.label).toBe('destroying')
            expect(model.error.body).toBe(error)
          })
        })

        it('rolls back the changes', () => {
          return model.destroy({ optimistic: false }).catch(() => {
            expect(collection.models.length).toBe(1)
          })
        })

        it('nullifies the request', () => {
          return model.destroy({ optimistic: false }).catch(() => {
            expect(model.request).toBe(null)
          })
        })
      })

      describe('when it succeeds', () => {
        beforeEach(() => {
          model.error = errorObject
          resolve()()
        })

        it('applies changes', () => {
          return model.destroy({ optimistic: false }).then(() => {
            expect(collection.models.length).toBe(0)
          })
        })

        it('nullifies the request', () => {
          return model.destroy({ optimistic: false }).then(() => {
            expect(model.request).toBe(null)
          })
        })

        it('clears the error', async () => {
          await model.destroy({ optimistic: false })
          expect(model.error).toBe(null)
        })
      })
    })
  })

  describe('fetch', () => {
    describe('when it fails', () => {
      beforeEach(reject)

      it('sets the error', () => {
        return model.fetch().catch(() => {
          expect(model.error.label).toBe('fetching')
          expect(model.error.body).toBe(error)
        })
      })

      it('nullifies the request', () => {
        return model.fetch().catch(() => {
          expect(model.request).toBe(null)
        })
      })
    })

    describe('when it succeeds', () => {
      beforeEach(() => {
        model.error = errorObject
        resolve({ name: 'bill' })()
      })

      it('returns the response', () => {
        return model.fetch().then((response) => {
          expect(response.name).toBe('bill')
        })
      })

      it('sets the response as attributes', () => {
        return model.fetch().then(() => {
          expect(model.get('name')).toBe('bill')
        })
      })

      it('nullifies the request', () => {
        return model.fetch().then(() => {
          expect(model.request).toBe(null)
        })
      })

      it('clears the error', async () => {
        await model.fetch()
        expect(model.error).toBe(null)
      })
    })
  })

  describe('rpc', () => {
    describe('when it fails', () => {
      beforeEach(reject)

      it('sets the error', () => {
        return model.rpc('approve').catch(() => {
          expect(model.error.label).toBe('updating')
          expect(model.error.body).toBe(error)
        })
      })

      it('nullifies the request', () => {
        return model.rpc('approve').catch(() => {
          expect(model.request).toBe(null)
        })
      })
    })

    describe('when it succeeds', () => {
      beforeEach(() => {
        model.error = errorObject
        resolve('foo')()
      })

      it('returns the response', () => {
        return model.rpc('approve').then((response) => {
          expect(response).toBe('foo')
        })
      })

      it('nullifies the request', () => {
        return model.rpc('approve').then(() => {
          expect(model.request).toBe(null)
        })
      })

      it('clears the error', async () => {
        await model.rpc('approve')
        expect(model.error).toBe(null)
      })
    })
  })
})
