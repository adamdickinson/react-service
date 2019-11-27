import '@testing-library/jest-dom/extend-expect'

import React, { useCallback, useState } from 'react'

import { fireEvent, render } from '@testing-library/react'

import { ServiceProps } from './';
import createService from '.'

interface User {
  name: string
}

interface AuthAPI {
  user?: User
  logIn: (username: string, password: string) => Promise<User>
  logOut: () => void
}

describe('createService', () => {
  let AuthService: React.FC<ServiceProps>
  let useAuthAPI: () => AuthAPI
  let useAuthService: () => AuthAPI
  let SampleComponent: React.FC

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

    [AuthService, useAuthService] = createService<AuthAPI>(useAuthAPI)

    SampleComponent = () => {
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
  })

  it('should create a basic service', () => {
    const { debug, getByTestId } = render(
      <AuthService>
        <SampleComponent />
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
})
