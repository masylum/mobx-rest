const Benchmark = require('benchmark')
const Index = require('../lib/index')
const suite = new Benchmark.Suite

class MockCollection extends Index.Collection {
  url () {
    return '/users'
  }

  model () {
    return Index.Model
  }
}

const collection = new MockCollection([])

for (var i = 10000; i--;)  {
  collection.add({ id: i, age: i })
}

suite
  .add('using the indexed id', () => {
    collection.find({ id: 5000 })
  })
  .add('using the unindexed age', () => {
    collection.find({ age: 5000 })
  })
  .on('cycle', (event) => {
    console.log(String(event.target))
  })
  .on('complete', function onComplete() {
    console.log('Fastest is ' + this.filter('fastest').map('name'))
  })
  .run({ 'async': true })
