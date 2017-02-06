# REST Mobx

REST conventions for mobx.

[![Build Status](https://travis-ci.org/masylum/mobx-rest.svg?branch=master)](https://travis-ci.org/masylum/mobx-rest)

![](https://media.giphy.com/media/b9QBHfcNpvqDK/giphy.gif)

## Installation

```
npm install mobx-rest --save
```

## What is it?

MobX is great to represent RESTful resources. Each resource can be represented
with a store which will the expected REST actions (`create`, `fetch`, `save`, `destroy`, ...).

Instead of writing hundreds of boilerplate lines we can leverage REST conventions
to deal with your API interactions.

## Example

```js
const apiPath = '/api'
import jqueryAdapter from 'mobx-rest-jquery-adapter'
import { apiClient, Collection, Model } from 'mobx-rest'

// Set the adapter
apiClient(jqueryAdapter, { apiPath })

class Task extends Model { }
class Tasks extends Collection {
  url ()  {
    return `/tasks`
  }

  model () {
    return Task
  }
}

const tasks = new Tasks()

import { observer } from 'mobx-react'

@observer
class Companies extends React.Component {
  componentWillMount () {
    tasks.fetch()
  }

  renderTask (task, i) {
    return <li key={i}><Task task={task} /></li>
  }

  render () {
    if (tasks.isRequest('fetching')) {
      return <span>Fetching tasks...</span>
    }

    return <ul>{tasks.models.map(this.renderTask.bind(this))}</ul>
  }
}

```

## Tree schema

Your tree will have the following schema:

```js
models: [
  {                       // Information at the resource level
    optimisticId: String, // Client side id. Used for optimistic updates
    request: {            // An ongoing request
      label: String,      // Examples: 'updating', 'creating', 'fetching', 'destroying' ...
      abort: Function,    // A method to abort the ongoing request
    },
    error: {              // A failed request
      label: String,      // Examples: 'updating', 'creating', 'fetching', 'destroying' ...
      body: String,       // A string representing the error
    },
    attributes: Object    // The resource attributes
  }
]                         // Information at the collection level
request: {                // An ongoing request
  label: String,          // Examples: 'updating', 'creating', 'fetching', 'destroying' ...
  abort: Function,        // A method to abort the ongoing request
  progress: number        // If uploading a file, represents the progress
},
error: {                  // A failed request
  label: String,          // Examples: 'updating', 'creating', 'fetching', 'destroying' ...
  body: Object,           // A string representing the error
}
```

## License

(The MIT License)

Copyright (c) 2017 Pau Ramon <masylum@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
