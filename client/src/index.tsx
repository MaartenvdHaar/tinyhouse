import React, { useEffect, useRef, useState } from 'react'
import { render } from 'react-dom'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, useMutation } from '@apollo/client'
import { setContext } from "@apollo/client/link/context"
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js'

import { Affix, Spin, Layout } from 'antd'
import { AppHeaderSkeleton, ErrorBanner } from "./lib/components"

import { Viewer } from './lib/types'
import reportWebVitals from './reportWebVitals'
import "./styles/index.css"

import { AppHeader, Home, Host, Listing, Listings, Login, NotFound, Stripe, User } from './sections'
import { LogIn as LogInData, LogInVariables } from './graphql/mutations/LogIn/__generated__/LogIn'
import { LOG_IN } from './graphql/mutations'

const development = process.env.NODE_ENV === 'development'
const httpLink = new HttpLink({ uri: `${development && 'http://localhost:8080'}/api`, credentials: 'include' })

const authLink = setContext((_, { headers }) => {
  const token = sessionStorage.getItem("token")

  return {
    headers: {
      ...headers,
      "X-CSRF-TOKEN": token || "",
    },
  }
})

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: authLink.concat(httpLink),
})

const initialViewer: Viewer = {
  id: null,
  token: null,
  avatar: null,
  hasWallet: null,
  didRequest: false
}

const spKey = 'pk_test_51JK2GoI80NFNbk9lszMBf9ijbynoxTW501rqQzp5UaYqKr9pafr8JKzK1TYkbLrPxb0sCsBlIVWxI0WZfoK2jtG600ficxsRqf'
const stripePromise = loadStripe(`${process.env.REACT_APP_S_PUBLISHABLE_KEY || spKey}`);

const App = () => {
  const [viewer, setViewer] = useState<Viewer>(initialViewer)

  const [logIn, { error }] = useMutation<LogInData, LogInVariables>(LOG_IN, {
    onCompleted: data => {
      if (data?.logIn) {
        setViewer(data.logIn)

        if (data.logIn.token) {
          sessionStorage.setItem('token', data.logIn.token)
        } else {
          sessionStorage.removeItem('token')
        }
      }
    }
  })

  const LogInRef = useRef(logIn)

  useEffect(() => {
    LogInRef.current()
  }, [])

  if (!viewer.didRequest && !error) {
    return (
      <Layout className="app-skeleton">
        <AppHeaderSkeleton />
        <div className="app-skeleton__spin-section">
          <Spin size="large" tip="Launching Tinyhouse" />
        </div>
      </Layout>
    )
  }

  const logInErrorBannerElement = error ? (
    <ErrorBanner description="We weren't able to verify if you were logged in. Please try again later!" />
  ) : null

  return (
    <Router>
      <Layout id='app'>
        {logInErrorBannerElement}

        <Affix offsetTop={0} className="app__affix-header">
          <AppHeader viewer={viewer} setViewer={setViewer} />
        </Affix>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/host" render={props => <Host {...props} viewer={viewer} />} />
          <Route exact path="/listing/:id" render={props => <Elements stripe={stripePromise}><Listing {...props} viewer={viewer} /></Elements>} />
          <Route exact path="/listings/:location?" component={Listings} />
          <Route exact path="/login" render={props => <Login {...props} setViewer={setViewer} />} />
          <Route exact path="/stripe" render={props => <Stripe {...props} viewer={viewer} setViewer={setViewer} />} />
          <Route exact path="/user/:id" render={props => <User {...props} viewer={viewer} setViewer={setViewer} />}  />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </Router>
  )
}

render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
