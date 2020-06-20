# React Service

Internal APIs for your application.

A React Service is one answer to the questions:

_How should I manage state in my application? Redux has a lot of boilerplate and slows us down, MobX is tricky to debug and is kinda magic, component state + prop drilling is annoying and adds unnecessary complexity, React context is annoying to set up. What do?_

## Installation

```sh
npm install @adamdickinson/react-service
```

or

```sh
yarn add @adamdickinson/react-service
```

## API

There's only one method you really need to know about:

`createService(hook) -> [ProviderComponent, UseServiceHook]`

Creates the provider and access hook for a new service.

### Parameters

**hook**

A react hook function used to expose data.

### Returns

**[ProviderComponent, UseServiceHook]**

Much like React's `useState` method, will return two values - the definition of
a provider component, and the definition of a service hook.

The provider component is designed to be rendered in your application,
providing access to the defined service to all child components.

The service hook is designed to be used within child components as needed to
access service data.

## Usage

Let's cut the discourse - it's demo time. Here are a handful of ways to
implement what is effectively the same thing:

### Basic Usage

As a contrived example, let's say we want to make a random number service.

```ts
// 1. We define the service
const [NumberProvider, useNumber] = createService(({ max: number }) => {
  const [number, setNumber] = useState<number>()
  return {
    update: () => setNumber(Math.floor(Math.random() * max)),
    number,
  }
})

// 2. We use the service with the `useNumber` hook in some components
const Displayer = () => {
  const { number } = useNumber()
  return <p>The number is {number}</p>
}

const Changer = () => {
  const { update } = useNumber()
  return <button onClick={update}>Randomize!</button>
}

// 3. We expose the service to those components that use it by rendering a parent `NumberProvider` component
ReactDOM.render(
  <NumberProvider max={100}>
    <Displayer />
    <Changer />
  </NumberProvider>,
  document.getElementById('root')
)
```

### Usage as an Auth Service

Here's how we define a service. We start by simply and concisely defining data
and processes...

```ts
// src/services/auth.ts
import createService from '@adamdickinson/react-service'
import store from 'store'
import { useEffect, useState } from 'react'

// Define our contract
interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface AuthAPI {
  logIn(username: string, password: string): Promise<User>
  logOut(): void
  user?: User
}

// Define our API as a hook so we can leverage React functionality
const useAuthAPI = ({ serverUrl: string }) => {
  const [user, setUser] = useState<User>()

  const onChangeUser = (newUser?: User) => {
    // Set local state, and persist change to storage
    store.set('user', newUser)
    setUser(newUser)
  }

  useEffect(() => {
    // Restore existing user from persistent storage into local state
    const existingUser = store.get('user')
    if (existingUser) {
      setUser(existingUser)
    }
  }, [])

  const api: AuthAPI = {
    logIn: async (username: string, password: string) => {
      const response = await fetch(`${serverUrl}/login`)
      if (!response.ok) {
        throw new Error(response.statusText)
      }

      onChangeUser(await response.json())
    },
    logOut: () => onChangeUser(undefined),
    user,
  }

  return api
}

const [AuthService, useAuth] = createService<AuthAPI>(useAuthAPI)

export { AuthService, useAuth }
```

... then we expose it to our application...

```ts
// src/index.tsx
import ReactDOM from 'react-dom'
import App from './App'
import { AuthService } from './services/auth'

ReactDOM.render(
  <AuthService serverUrl="http://api.myapp.com">
    <App />
  </AuthService>,
  document.getElementById('root')
)
```

... and finally, start using it wherever we need it!

```ts
// src/App.tsx
import { useAuth } from './services/auth'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

export default () => {
  const { user } = useAuth()
  return (
    <Router>
      <Switch>
        // Unauthed routes
        {!user && <Route path="/" component={LogIn} />}
        // Authed routes
        {!!user && <Route path="/" component={Welcome} />}
      </Switch>
    </Router>
  )
}
```

```ts
// src/containers/LogIn.tsx
import { useAuth } from './services/auth'
import { useState } from 'react'

export default () => {
  const { logIn } = useAuth()
  const [loggingIn, setLoggingIn] = useState(false)
  const [error, setError] = useState('')

  const onLogIn = async () => {
    setLoggingIn(true)
    try {
      await logIn('me', 'my-pass')
    } catch (error) {
      setError(error?.message || error)
      setLoggingIn(false)
    }
  }

  return (
    <>
      {error && <p>{error}</p>}
      <button onClick={onLogIn}>Log In</button>
    </>
  )
}
```

```ts
// src/containers/Welcome.tsx
import { useAuth } from './services/auth'

export default () => {
  const { user } = useAuth()
  return `Welcome ${user?.firstName}!`
}
```

## Limitations

Any good library will identify where it falls down and where it wants to
improve. In an attempt to make this a good library too, here goes:

### Too many services spoil the broth

Using multiple services at once poses some interesting challenges:

#### 1. Nesting Nightmares

Look at this (if you dare):

```ts
const App = ({ children }) => (
  <AuthProvider>
    <APIProvider>
      <CommentsProvider>
        <PlaylistProvider>{children}</PlaylistProvider>
      </CommentsProvider>
    </APIProvider>
  </AuthProvider>
)
```

It only uses four randomly named services, but it's already becoming a nested
mess.

#### 2. Inter-service Relationships

Let's say we have an Auth service that uses an API service to communicate on
its behalf, but the API service needs an auth token. Very quickly, we discover
that we have a circular dependency. There are ways to handle this - namely
delegating the task of token association to the caller rather than have the API
service itself associate it to a call, but that's adding more complexity.

#### 3. Performance Risks

While no performance issues have arisen in our extensive experimentation with
this library, there is a risk of running extra renders when they are simply not
required, again due to the nested nature of services, however more research is
required here to confirm or deny this to any real extent.

### There ain't much structure

Redux has set standard processes when it comes to its actions and reducers.
It's all explicit and all verbose. While this is often seen as a curse, it can
also be a blessing as it also defines a structure that many developers can work
with simultaneously.

There is very little boilerplate, and therefore very few explicit structure
requirements for services. While this does mean getting more done with much
less code, it also makes things less verbose and less structured.

### Got more?

Spin up an issue!

### Got a solution?

Spin up a PR! Standards are pretty high, but feedback is a cornerstone of any
good pull request so expect much love for any contributions.
