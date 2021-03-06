import React, { useEffect, useRef } from "react"
import { useApolloClient, useMutation } from "@apollo/client"
import { Card, Layout, Spin, Typography } from "antd"
import { Redirect, useLocation } from "react-router-dom"

import { ErrorBanner } from "../../lib/components"
import { displaySuccessNotification, displayErrorMessage } from "../../lib/utils"

import { AUTH_URL } from '../../graphql/queries'
import { LOG_IN } from '../../graphql/mutations'

import { AuthUrl as AuthUrlData } from '../../graphql/queries/AuthUrl/__generated__/AuthUrl'
import { LogIn as LogInData, LogInVariables } from '../../graphql/mutations/LogIn/__generated__/LogIn'

// Image Assets
import googleLogo from "./assets/google_logo.jpg"
import { Viewer } from "../../lib/types"

const { Content } = Layout
const { Text, Title } = Typography

export interface Props {
  setViewer: (viewer: Viewer) => void
}

export const Login: React.FC<Props> = ({ setViewer }) => {
  const client = useApolloClient()

  const [
    logIn,
    { data: logInData, loading: logInLoading, error: logInError }
  ] = useMutation<LogInData, LogInVariables>(LOG_IN, {
    onCompleted: data => {
      if (data?.logIn && data?.logIn?.token) {
        setViewer(data.logIn)
        sessionStorage.setItem('token', data.logIn.token)
        displaySuccessNotification("You've successfully logged in!")
      }
    },
    onError: () => {}
  })

  const logInRef = useRef(logIn)
  const location = useLocation()

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const code = searchParams.get("code")

    if (code) {
      logInRef.current({
        variables: {
          input: { code }
        }
      })
    }
  }, [location.search])

  const handleAuthorize = async () => {
    try {
      const { data } = await client.query<AuthUrlData>({
        query: AUTH_URL
      })

      window.location.assign(data?.authUrl)
    } catch(error) {
      displayErrorMessage(
        "Sorry! We weren't able to log you in. Please try again later!"
      )
    }
  }

  if (logInLoading) {
    return (
      <Content className="log-in">
        <Spin size="large" tip="Logging you in..." />
      </Content>
    )
  }

  if (logInData && logInData.logIn) {
    const { id: viewerId } = logInData.logIn
    return <Redirect to={`/user/${viewerId}`} />
  }

  const logInErrorBannerElement = logInError ? (
    <ErrorBanner description="Sorry! We weren't able to log you in. Please try again later!" />
  ) : null


  return (
    <Content className="log-in">
      {logInErrorBannerElement}
      <Card className="log-in-card">
        <div className="log-in-card__intro">
          <Title level={3} className="log-in-card__intro-title">
            <span role="img" aria-label="wave">
              ????
            </span>
          </Title>
          <Title level={3} className="log-in-card__intro-title">
            Log in to TinyHouse!
          </Title>
          <Text>Sign in with Google to start booking available rentals!</Text>
        </div>
        <button className="log-in-card__google-button" onClick={handleAuthorize}>
          <img
            src={googleLogo}
            alt="Google Logo"
            className="log-in-card__google-button-logo"
          />
          <span className="log-in-card__google-button-text">Sign in with Google</span>
        </button>
        <Text type="secondary">
          Note: By signing in, you'll be redirected to the Google consent form to sign in
          with your Google account.
        </Text>
      </Card>
    </Content>
  )
}