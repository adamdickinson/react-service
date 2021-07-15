import '@testing-library/jest-dom/extend-expect'

import React, { useCallback, useState } from 'react'

import { fireEvent, render } from '@testing-library/react'

import {createService, extendService} from '.'

interface User {
  name: string
}

describe('createService', () => {
  const useAuthAPI = () => {
    const [user, setUser] = useState<User | undefined>(undefined)

    const logIn = useCallback(
      async (username: string, _password: string) => {
        setUser({ name: username })
        return user
      },
      [setUser]
    )

    const logOut = useCallback(() => {
      setUser(undefined)
    }, [setUser])

    return { user, logIn, logOut }
  }


  const [AuthService, useAuthService, authContext] = createService(useAuthAPI)

  const AuthScreen = () => {
    const auth = useAuthService()
    if (!auth) {
      return <div>Auth service not found</div>
    }

    const { user, logIn, logOut } = auth
    return (
      <div>
        <h1 data-testid="welcome">Hi there{user ? ` ${user.name}` : ''}!</h1>
        <button
          onClick={user ? logOut : () => logIn('joe', '')}
          data-testid="logInOut"
        >
          Log {user ? 'out' : 'in'}
        </button>
      </div>
    )
  }

  type Props = ReturnType<typeof useAuthService>

  const AuthScreenUsingProps: React.FC<Props> = ({ user, logIn, logOut }) => {
    return (
      <div>
        <h1 data-testid="welcome">Hi there{user ? ` ${user.name}` : ''}!</h1>
        <button
          onClick={user ? logOut : () => logIn('joe', '')}
          data-testid="logInOut"
        >
          Log {user ? 'out' : 'in'}
        </button>
      </div>
    )
  }

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

    expect(name).toHaveTextContent('Hi there joe!')
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

    const AltService = extendService(authContext, useAltAPI)

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

    expect(name).toHaveTextContent('Hi there joe!')
    expect(button).toHaveTextContent('Log out')
    fireEvent.click(button)

    expect(name).toHaveTextContent('Hi there!')
    expect(button).toHaveTextContent('Log in')
    fireEvent.click(button)
  })

  it('should return undefined if service is not available', () => {
    const { getByText } = render(
      <AuthScreen />
    )

    const serviceNotFoundMessage = getByText('Auth service not found')
    expect(serviceNotFoundMessage).toBeInTheDocument()
  })
})
