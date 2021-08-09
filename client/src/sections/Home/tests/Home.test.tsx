import { MockedProvider } from '@apollo/client/testing'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { createMemoryHistory } from 'history'
import { Router } from 'react-router-dom'

import { LISTINGS } from '../../../graphql/queries'
import { ListingsFilter } from '../../../graphql/globalTypes'
import { Home } from '..'

describe('Home', () => {
  global.matchMedia = global.matchMedia || function () {
    return {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  };

  describe("search input", () => {
    it('renders an empty input on initial render', async () => {
      const history = createMemoryHistory()
      const { getByPlaceholderText } = render(
        <MockedProvider mocks={[]}>
          <Router history={history}>
            <Home />
          </Router>
        </MockedProvider>
      )

      await waitFor(() => {
        const searchInput = getByPlaceholderText("Search 'Deventer'") as HTMLInputElement

        expect(searchInput.value).toEqual('')
      })
    })

    it('redirects to listings page when a valid search is provided', async () => {
      const history = createMemoryHistory()
      const { getByPlaceholderText } = render(
        <MockedProvider mocks={[]}>
          <Router history={history}>
            <Home />
          </Router>
        </MockedProvider>
      )

      await waitFor(() => {
        const searchInput = getByPlaceholderText("Search 'Deventer'") as HTMLInputElement
        fireEvent.change(searchInput, { target: { value: 'Toronto' }})
        fireEvent.keyDown(searchInput, {
          key: 'Enter',
          keyCode: 13
        })

        expect(history.location.pathname).toBe('/listings/Toronto')
      })
    })

    it('does not redirects to listings page when an invalid search is provided', async () => {
      const history = createMemoryHistory()
      const { getByPlaceholderText } = render(
        <MockedProvider mocks={[]}>
          <Router history={history}>
            <Home />
          </Router>
        </MockedProvider>
      )

      await waitFor(() => {
        const searchInput = getByPlaceholderText("Search 'Deventer'") as HTMLInputElement
        fireEvent.change(searchInput, { target: { value: '' } })
        fireEvent.keyDown(searchInput, {
          key: 'Enter',
          keyCode: 13
        })

        expect(history.location.pathname).toBe('/')
      })
    })
  })

  describe(('Premium Listings'), () => {
    it('renders the loading state when the query is loading', async () => {
      const history = createMemoryHistory()
      const { queryByRole, queryByText } = render(
        <MockedProvider mocks={[]}>
          <Router history={history}>
            <Home />
          </Router>
        </MockedProvider>
      )

      await waitFor(() => {
        expect(queryByRole('alert')).not.toBeNull()
        expect(queryByText('Premium Listings')).toBeNull()
      })
    })

    it('renders the premium listing component', async () => {
      const listingsMock = {
        request: {
          query: LISTINGS,
          variables: {
            filter: ListingsFilter.PRICE_HIGH_TO_LOW,
            limit: 4,
            page: 1
          },
        },
        result: {
          data: {
            listings: {
              region: null,
              total: 10,
              result: [
                {
                  id: 'Lorem ipsum',
                  title: 'Lorem ipsum',
                  image: 'image.png',
                  address: 'address',
                  price: 9,
                  numOfGuests: 9,
                }
              ]
            }
          }
        }
      }

      const history = createMemoryHistory()
      const { queryByRole, queryByText } = render(
        <MockedProvider mocks={[listingsMock]} addTypename={false}>
          <Router history={history}>
            <Home />
          </Router>
        </MockedProvider>
      )

      await waitFor(() => {
        expect(queryByRole('alert')).toBeNull()
        expect(queryByText('Premium Listings')).not.toBeNull()
      })
    })

    it('renders neither loading or the premium component', async () => {
      const listingsMock = {
        request: {
          query: LISTINGS,
          variables: {
            filter: ListingsFilter.PRICE_HIGH_TO_LOW,
            limit: 4,
            page: 1
          },
        },
        error: new Error('network error')
      }

      const history = createMemoryHistory()
      const { queryByRole, queryByText } = render(
        <MockedProvider mocks={[listingsMock]} addTypename={false}>
          <Router history={history}>
            <Home />
          </Router>
        </MockedProvider>
      )

      await waitFor(() => {
        expect(queryByRole('alert')).toBeNull()
        expect(queryByText('Premium Listings')).toBeNull()
      })
    })
  }) 
})