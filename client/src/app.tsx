import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { Switch, Route, useLocation } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js'

import { Affix, Spin, Layout } from 'antd'
import { AppHeaderSkeleton, ErrorBanner } from "./lib/components"

import { Viewer } from './lib/types'

import { AppHeader, Home, Host, Listing, Listings, Login, NotFound, Stripe, User } from './sections'
import { LogIn as LogInData, LogInVariables } from './graphql/mutations/LogIn/__generated__/LogIn'
import { LOG_IN } from './graphql/mutations'

const initialViewer: Viewer = {
  id: null,
  token: null,
  avatar: null,
  hasWallet: null,
  didRequest: false
}

const spKey = 'pk_test_51JK2GoI80NFNbk9lszMBf9ijbynoxTW501rqQzp5UaYqKr9pafr8JKzK1TYkbLrPxb0sCsBlIVWxI0WZfoK2jtG600ficxsRqf'
const stripePromise = loadStripe(`${process.env.REACT_APP_S_PUBLISHABLE_KEY || spKey}`);

export const App = () => {
  const [viewer, setViewer] = useState<Viewer>(initialViewer)
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

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
    <Layout id='app'>
      {logInErrorBannerElement}

      <Affix offsetTop={0} className="app__affix-header">
        <AppHeader viewer={viewer} setViewer={setViewer} />
      </Affix>
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
        <Route exact path="/host">
          <Host viewer={viewer} />
        </Route>
        <Route exact path="/listing/:id">
          <Elements stripe={stripePromise}>
            <Listing viewer={viewer} />
          </Elements>
        </Route>
        <Route exact path="/listings/:location?" >
          <Listings />
        </Route>
        <Route exact path="/login">
            <Login setViewer={setViewer} />
          </Route>
        <Route exact path="/stripe">
            <Stripe viewer={viewer} setViewer={setViewer} />
          </Route>
        <Route exact path="/user/:id">
          <User viewer={viewer} setViewer={setViewer} />
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </Layout>
  )
}

