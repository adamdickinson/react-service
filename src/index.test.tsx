import '@testing-library/jest-dom/extend-expect'

import React, { useCallback, useState } from 'react'

import { fireEvent, render } from '@testing-library/react'

import { ServiceProps } from './'
import {createService, extendService} from '.'

interface User {
  name: string
}

interface AuthAPI {
  user?: User
  logIn: (username: string, password: string) => Promise<User>
  logOut: () => void
}

describe('createService', () => {
  let AuthService: React.FC<ServiceProps<AuthAPI>>
  let authContext: React.Context<AuthAPI>
  let useAuthAPI: () => AuthAPI
  let useAuthService: () => AuthAPI
  let AuthScreen: React.FC
  let AuthScreenUsingProps: React.FC<AuthAPI>

  beforeAll(() => {
    useAuthAPI = () => {
      const [user, setUser] = useState<User>(undefined)

      const logIn = useCallback(
        async (username: string, password: string) => {
          setUser({ name: 'you' })
          return user
        },
        [setUser]
      )

      const logOut = useCallback(() => {
        setUser(undefined)
      }, [setUser])

      return { user, logIn, logOut }
    }

    [AuthService, useAuthService, authContext] = createService<AuthAPI>(
      useAuthAPI
    )

    AuthScreen = () => {
      const { user, logIn, logOut } = useAuthService()
      return (
        <div>
          <h1 data-testid="welcome">Hi there{user ? ` ${user.name}` : ''}!</h1>
          <button
            onClick={user ? logOut : () => logIn('', '')}
            data-testid="logInOut"
          >
            Log {user ? 'out' : 'in'}
          </button>
        </div>
      )
    }

    AuthScreenUsingProps = ({ user, logIn, logOut }) => {
      return (
        <div>
          <h1 data-testid="welcome">Hi there{user ? ` ${user.name}` : ''}!</h1>
          <button
            onClick={user ? logOut : () => logIn('', '')}
            data-testid="logInOut"
          >
            Log {user ? 'out' : 'in'}
          </button>
        </div>
      )
    }
  })

  it('should create a basic service', () => {
    const { getByTestId } = render(
      <AuthService>
        <AuthScreen />
      </AuthService>
    )

    const name = getByTestId('welcome')
    const button = getByTestId('logInOut')

    expect(name).toHaveTextContent('Hi there!')
    expect(button).toHaveTextContent('Log in')
    fireEvent.click(button)

    expect(name).toHaveTextContent('Hi there you!')
    expect(button).toHaveTextContent('Log out')
    fireEvent.click(button)

    expect(name).toHaveTextContent('Hi there!')
    expect(button).toHaveTextContent('Log in')
    fireEvent.click(button)
  })

  it('should create an alternate service', () => {
    const useAltAPI = () => ({
      user: { name: 'alt' },
      logIn: () => Promise.resolve({ name: 'logged out' }),
      logOut: () => {},
    })

    const AltService = extendService<AuthAPI>(authContext, useAltAPI)

    const { getByTestId } = render(
      <AltService>
        <AuthScreen />
      </AltService>
    )

    const name = getByTestId('welcome')
    const button = getByTestId('logInOut')

    expect(name).toHaveTextContent('Hi there alt!')
    expect(button).toHaveTextContent('Log out')
  })

  it('should pass api to child function', () => {
    const { getByTestId } = render(
      <AuthService>{api => <AuthScreenUsingProps {...api} />}</AuthService>
    )

    const name = getByTestId('welcome')
    const button = getByTestId('logInOut')

    expect(name).toHaveTextContent('Hi there!')
    expect(button).toHaveTextContent('Log in')
    fireEvent.click(button)

    expect(name).toHaveTextContent('Hi there you!')
    expect(button).toHaveTextContent('Log out')
    fireEvent.click(button)

    expect(name).toHaveTextContent('Hi there!')
    expect(button).toHaveTextContent('Log in')
    fireEvent.click(button)
  })
})
