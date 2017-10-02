# mobx-rest

REST conventions for mobx.

[![Build Status](https://travis-ci.org/masylum/mobx-rest.svg?branch=master)](https://travis-ci.org/masylum/mobx-rest)
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](http://standardjs.com)

![](https://media.giphy.com/media/b9QBHfcNpvqDK/giphy.gif)

## Installation

```
npm install mobx-rest --save
```

## What is it?

An application state is usually divided into three realms:

  - **Component state**: Each state can have their own state, like a button
  being pressed, a text input value, etc.
  - **Application state**: Sometimes we need components to share state between them and
  they are too far away to actually make them talk each other through props.
  - **Resources state**: Other times, state is persisted in the server. We synchronize
  that state through APIs that consume *resources*. One way to synchronize this state
  is through REST.

MobX is an excellent state management choice to deal with those three realms:
It allows you to represent your state as a graph while other solutions,
like Redux for instance, force you to represent your state as a tree.

With `mobx-rest` resources are implemented with all their REST
actions built in (`create`, `fetch`, `save`, `destroy`, ...) so instead
of writing, over and over, hundreds of lines of boilerplate we can leverage
REST conventions to minimize the code needed for your API interactions.

## Full React example

If you want to see a full example with React you
can check out the [mobx-rest-example repo](https://github.com/masylum/mobx-rest-example).
The demo is deployed [here](https://demo-wiimsnkpdy.now.sh/).

## Documentation

`mobx-rest` is very simple and its source code can be read in 5 minutes.

### `Model`

A `Model` represents one resource. It's identified by a primary key (mandatory) and holds
its attributes. You can create, update and destroy models in the client and then sync
them with the server. Apart from its attributes, a `Model` also holds the state of
the interactions with the server so you can react to those easily (showing loading states
for instance).

#### `attributes: ObservableMap`

An `ObservableMap` that holds the attributes of the model.

#### `collection: ?Collection`

A pointer to a `Collection`. By having models
"belong to" a collection you can take the most out
of `mobx-rest`.

#### `request`

A `Request` object that represents the state of the ongoing request, if any.

#### `error`

An `Error` object that represents the state of the failed request, if any.

#### `constructor(attributes: Object)`

Initialize the model with the given attributes.

#### `toJS(): Object`

Return the object version of the attributes.

#### `primaryKey: string`

Implement this abstract method so `mobx-rest` knows what to
use as a primary key. It defaults to `'id'` but if you use
something like mongodb you can change it to `'_id'`.

#### `urlRoot(): string`

Implement this abstract method so `mobx-rest` knows where
its API points to. If the model belongs to a `Collection`
(setting the `collection` attribute) this method does
not need to be implemented.

#### `url(): string`

Return the url for that given resource. Will leverage the
collection's base url (if any) or `urlRoot`. It uses the
primary id since that's REST convention.

Example: `tasks.get(34).url() // => "/tasks/34"`

#### `isRequest(label: string): boolean`

Helper method that asks the model whether there is an ongoing
request with the given label.

Example: `file.isRequest('saving')`

#### `isNew: boolean`

Return whether that model has been synchronized with the server or not.
Resources created in the client side (optimistically) don't have
an `id` attribute yet (that's given by the server)

Example:

```js
const user = new User({ name : 'Pau' })
user.isNew // => true
user.save()
user.isNew // => false
user.get('id') // => 1
```

#### `get(attribute: string): any`

Get the given attribute. If the attribute does not exist, it will throw.

#### `has(attribute: string): boolean`

Check that the given attribute exists.

#### `set(data: Object): void`

Update the attributes in the client.

Example:

```js
const folder = new Folder({ name : 'Trash' })
folder.get('name') // => 'Trash'
folder.set({ name: 'Rubbish' })
folder.get('name') // => 'Rubbish'
```

#### `fetch(options): Promise`

Request this resource's data from the server. It tracks the state
of the request using the label `fetching` and updates the resource when
the data is back from the API.

Example:

```js
const task = new Task({ id: 3 })
const promise = task.fetch()
task.isRequest('fetching') // => true
await promise
task.get('name') // => 'Do the laundry'
```

#### `save(attributes: Object, options: Object): Promise`

The opposite of `fetch`. It takes the resource from the client and
persists it in the server through the API. It accepts some attributes
as the first argument so you can use it as a `set` + `save`.
It tracks the state of the request using the label `saving`.

Options:

  - `optimistic = true` Whether we want to update the resource in the client
  first or wait for the server's response.
  - `patch = true` Whether we want to use the `PATCH` verb and semantics, sending
  only the changed attributes instead of the whole resource down the wire.

Example:

```js
const company = new Company({ name: 'Teambox' })
const promise = company.save({ name: 'Redbooth' }, { optimistic: false })
company.isRequest('saving') // => true
company.get('name') // => 'Teambox'
await promise
company.get('name') // => 'Redbooth'
```

#### `destroy(options: Object): Promise`

Tells the API to destroy this resource.

Options:

  - `optimistic = true` Whether we want to delete the resource in the client
  first or wait for the server's response.

#### `rpc(method: 'string', body: {}): Promise`

When dealing with REST there are always cases when we have some actions beyond
the conventions. Those are represented as `rpc` calls and are not opinionated.

Example:

```js
const response = await task.rpc('resolveSubtasks', { all: true })
if (response.ok) {
  task.subTasks.fetch()
}
```

### `Collection`

A `Collection` represents a group of resources. Each element of a `Collection` is a `Model`.
Likewise, a collection tracks also the state of the interactions with the server so you
can react accordingly.

#### `models: ObservableArray`

An `ObservableArray` that holds the collection of models.

#### `request: ?Request`

A `Request` object that represents the state of the ongoing request, if any.

#### `error: ?ErrorObject`

An `Error` object that represents the state of the failed request, if any.

#### `constructor(data: Array<Object>)`

Initializes the collection with the given resources.

#### `url(): string`

Abstract method that must be implemented if you want your collection
and it's models to be able to interact with the API.

#### `model(): Model`

Abstract method that tells which kind of `Model` objects this collection
holds. This is used, for instance, when doing a `collection.create` so
we know which object to instantiate.

#### `toJS(): Array<Object>`

Return a plain data structure representing the collection of resources
without all the observable layer.

#### `toArray(): Array<ObservableMap>`

Return an array with the observable resources.

#### `isRequest(label: string): boolean`

Helper method that asks the collection whether there is an ongoing
request with the given label.

Example: 

```js
filesCollection.isRequest('saving')
```

#### `isEmpty(): boolean`

Helper method that asks the collection whether there is any
model in it.

Example: 

```js
const promise = usersCollection.fetch()
usersCollection.isEmpty() // => true
await promise
usersCollection.isEmpty() // => false
usersCollection.models.length // => 10
```

#### `at(index: number): ?Model`

Find a model at the given position.

#### `get(id: number): ?Model`

Find a model (or not) with the given id.

#### `filter(query: Object): Array<Model>`

Helper method that filters the collection by the given conditions represented
as a key value.

Example: 

```js
const resolvedTasks = tasksCollection.filter({ resolved: true })
resolvedTasks.length // => 3
```

#### `find(query: Object): ?Model`

Same as `filter` but it will halt and return when the first model matches
the conditions.

Example: 

```js
const pau = usersCollection.find({ name: 'pau' })
pau.get('name') // => 'pau'
```

#### `add(data: Array<Object>): Array<Model>`

Adds models with the given array of attributes.

```js
usersCollection.add([{id: 1, name: 'foo'}])
```

#### `reset(data: Array<Object>): Array<Model>`

Resets the collection with the given models.

```js
usersCollection.reset([{id: 1, name: 'foo'}])
```

#### `remove(ids: Array<number>): void`

Remove any model with the given ids.

Example: 

```js
usersCollection.remove([1, 2, 3])
```

#### `set(models: Array<Object>, options: Object): void`

Merge the given models smartly the current ones in the collection.
It detects what to add, remove and change.

Options:

  - `add = true` Change to disable adding models
  - `change = true` Change to disable updating models
  - `remove = true` Change to disable removing models

```js
const companiesCollection = new CompaniesCollection([
  { id: 1, name: 'Teambox' }
  { id: 3, name: 'Zpeaker' }
])
companiesCollection.set([
  { id: 1, name: 'Redbooth' },
  { id: 2, name: 'Factorial' }
])
companiesCollection.get(1).get('name') // => 'Redbooth'
companiesCollection.get(2).get('name') // => 'Factorial'
companiesCollection.get(3) // => null
```

#### `build(attributes: Object): Model`

Instantiates and links a model to the current collection.

```js
const factorial = companiesCollection.build({ name: 'Factorial' })
factorial.collection === companiesCollection // => true
factorial.get('name') // 'Factorial'
```

#### `create(target: Object | Model, options: Object)`

Add and save to the server the given model. If attributes are given,
also it builds the model for you. It tracks the state of the request
using the label `creating`.

Options:

  - `optimistic = true` Whether we want to create the resource in the client
  first or wait for the server's response.

```js
const promise = tasksCollection.create({ name: 'Do laundry' })
tasksCollection.isRequest('creating') // => true
await promise
tasksCollection.at(0).get('name') // => 'Do laundry'
```

#### `fetch(options: Object)`

Fetch the date from the server and then calls `set` to update the current
models. Accepts any option from the `set` method.

```js
const promise = tasksCollection.fetch()
tasksCollection.isEmpty() // => true
tasksCollection.isRequest('fetching') // => true
await promise
tasksCollection.isEmpty() // => false
```

#### `rpc(method: 'string', body: {}): Promise`

Exactly the same as the model one, but at the collection level.

### `apiClient`

This is the object that is going to make the `xhr` requests to interact with your API.
There are two example implementations currently:

  - One using `jQuery` in the `mobx-rest-jquery-adapter` package.
  - One using `fetch` in the `mobx-rest-fetch-adapter` package.

## Simple Example

A collection looks like this:

```js
// TasksCollection.js
const apiPath = '/api'
import adapter from 'mobx-rest-fetch-adapter'
import { apiClient, Collection, Model } from 'mobx-rest'

// We will use the adapter to make the `xhr` calls
apiClient(adapter, { apiPath })

class Task extends Model { }
class Tasks extends Collection {
  url ()  { return `/tasks` }
  model () { return Task }
}

// We instantiate the collection and export it as a singleton
export default new Tasks()
```

And here an example of how to use React with it:

```js
import tasksCollection from './TasksCollection'
import { computed } from 'mobx'
import { observer } from 'mobx-react'

@observer
class Task extends React.Component {
  onClick () {
    this.props.task.save({ resolved: true })
  }

  render () {
    return (
      <li key={task.id}>
        <button onClick={this.onClick.bind(this)}>
          resolve
        </button>
        {this.props.task.get('name')}
      </li>
    )
  }
}

@observer
class Tasks extends React.Component {
  componentWillMount () {
    // This will call `/api/tasks?all=true`
    tasksCollection.fetch({ data: { all: true } })
  }

  @computed
  get activeTasks () {
    return tasksCollection.filter({ resolved: false })
  }

  render () {
    if (tasksCollection.isRequest('fetching')) {
      return <span>Fetching tasks...</span>
    }

    return (
      <div>
        <span>{this.activeTasks.length} tasks</span>
        <ul>{activeTasks.map((task) => <Task task={task} />)}</ul>
      </div>
    )
  }
}

```

## State shape

Your collections and models will have the following state shape:

### Collection

```js
models: Array<Model>      // This is where the models live
request: {                // An ongoing request
  label: string,          // Examples: 'updating', 'creating', 'fetching', 'destroying' ...
  abort: () => void,      // A method to abort the ongoing request
  progress: number        // If uploading a file, represents the progress
},
error: {                  // A failed request
  label: string,          // Examples: 'updating', 'creating', 'fetching', 'destroying' ...
  body: Object,           // A string representing the error
}
```

### Model

```js
attributes: Object    // The resource attributes
optimisticId: string, // Client side id. Used for optimistic updates
request: {            // An ongoing request
  label: string,      // Examples: 'updating', 'creating', 'fetching', 'destroying' ...
  abort: () => void,  // A method to abort the ongoing request
},
error: {              // A failed request
  label: string,      // Examples: 'updating', 'creating', 'fetching', 'destroying' ...
  body: string,       // A string representing the error
},
```

## FAQ

### How do I create relations between the models?

This is something that mobx makes really easy to achieve:

```js
import usersCollection from './UsersCollections'
import { computed } from 'mobx'

class Task extends Model {
  @computed
  author () {
    const userId = this.get('userId')
    return usersCollection.get(userId) ||
      usersCollection.nullObject()
  }
}
```

I recommend to always fallback with a null object which will facilitate
a ton to write code like `task.author.get('name')`.

## Where is it used?

Developed and battle tested in production in [Factorial](https://factorialhr.com)

## License

(The MIT License)

Copyright (c) 2017 Pau Ramon <masylum@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
