import { MockedProvider } from '@apollo/client/testing'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { createMemoryHistory } from 'history'
import { Route, Router } from 'react-router-dom'

import { Login } from '..'
import { LOG_IN } from '../../../graphql/mutations'
import { AUTH_URL } from '../../../graphql/queries'

const defaultProps = {
  setViewer: () => {}
}

Object.defineProperty(window, 'location', {
  writable: true,
  value: { assign: jest.fn() }
});

describe('Login', () => {
  describe('AUTH_URL Query', () => {
    it('redirects the user if query is successful', async () => {
      window.location.assign = jest.fn()
      const authUrl = 'https://google.com/signin'

      const authUrlMock = {
        request: {
          query: AUTH_URL,
        },
        result: {
          data: {
            authUrl
          }
        }
      }
      const history = createMemoryHistory({
        initialEntries: ['/login']
      })

      const { getByRole, queryByText } = render(
        <MockedProvider mocks={[authUrlMock]} addTypename={false}>
          <Router history={history}>
            <Route path="/login">
              <Login {...defaultProps} />
            </Route>
          </Router>
        </MockedProvider>
      )

      const authUrlButton = getByRole('button')
      fireEvent.click(authUrlButton)

      await waitFor(() => {
        expect(window.location.assign).toHaveBeenCalledWith(authUrl)
        expect(queryByText("Sorry! We weren't able to log you in. Please try again later!")).toBeNull()
      })
    })

    it('doesnt redirect the user if query is unsuccessful', async () => {
      window.location.assign = jest.fn()
      const authUrl = 'https://google.com/signin'

      const authUrlMock = {
        request: {
          query: AUTH_URL,
        },
        errors: [new GraphQLError('Something went wrong')]
      }
      const history = createMemoryHistory({
        initialEntries: ['/login']
      })

      const { getByRole, queryByText } = render(
        <MockedProvider mocks={[authUrlMock]} addTypename={false}>
          <Router history={history}>
            <Route path="/login">
              <Login {...defaultProps} />
            </Route>
          </Router>
        </MockedProvider>
      )

      const authUrlButton = getByRole('button')
      fireEvent.click(authUrlButton)

      await waitFor(() => {
        expect(window.location.assign).not.toHaveBeenCalledWith(authUrl)
        expect(queryByText("Sorry! We weren't able to log you in. Please try again later!")).not.toBeNull()
      })
    })
  })

  describe('LOGIN Mutation', () => {
    it('when no code in route, mutation is not fired', async () => {
      const loginMock = {
        request: {
          query: LOG_IN,
          variables: {
            input: {
              code: '1234'
            }
          }
        },
        result: {
          data: {
            logIn: {
              id: '1234',
              token: 'lorem',
              avatar: 'image.png',
              hasWallet: false,
              didRequest: true
            }
          }
        }
      }

      const history = createMemoryHistory({
        initialEntries: ['/login']
      })

      render(
        <MockedProvider mocks={[loginMock]} addTypename={false}>
          <Router history={history}>
            <Route path="/login">
              <Login {...defaultProps} />
            </Route>
          </Router>
        </MockedProvider>
      )

      await waitFor(() => {
        expect(history.location.pathname).not.toEqual('/user/1234')
      })
    })

    describe('code exist in route as query param', () => {
      it('redirects to userpage if mutation is successful', async () => {
        const loginMock = {
          request: {
            query: LOG_IN,
            variables: {
              input: {
                code: '1234'
              }
            }
          },
          result: {
            data: {
              logIn: {
                id: '1234',
                token: 'lorem',
                avatar: 'image.png',
                hasWallet: false,
                didRequest: true
              }
            }
          }
        }

        const history = createMemoryHistory({
          initialEntries: ['/login?code=1234']
        })

        render(
          <MockedProvider mocks={[loginMock]} addTypename={false}>
            <Router history={history}>
              <Route path="/login">
                <Login {...defaultProps} />
              </Route>
            </Router>
          </MockedProvider>
        )

        await waitFor(() => {
          expect(history.location.pathname).toEqual('/user/1234')
        })
      })

      it('doesnt redirects to userpage if mutation is unsuccessful', async () => {
        const loginMock = {
          request: {
            query: LOG_IN,
            variables: {
              input: {
                code: '1234'
              }
            }
          },
          errors: [new GraphQLError('Something went wrong')]
        }

        const history = createMemoryHistory({
          initialEntries: ['/login?code=1234']
        })

        const { queryByText } = render(
          <MockedProvider mocks={[loginMock]} addTypename={false}>
            <Router history={history}>
              <Route path="/login">
                <Login {...defaultProps} />
              </Route>
            </Router>
          </MockedProvider>
        )

        await waitFor(() => {
          expect(history.location.pathname).not.toBe('/user/1234')
          expect(queryByText("Sorry! We weren't able to log you in. Please try again later!")).not.toBeNull()
        })
      })
    })
  })
})